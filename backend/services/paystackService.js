const crypto = require('crypto');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_edceca613b76866540a501d9b4865c675de54dd8';
const PAYSTACK_API_BASE = 'https://api.paystack.co';

/**
 * Helper to make authenticated requests to Paystack API
 */
async function paystackRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${PAYSTACK_API_BASE}${endpoint}`, options);
  const result = await response.json();

  if (!response.ok || !result.status) {
    const errorMsg = result.message || `Paystack API error: ${response.statusText}`;
    const err = new Error(errorMsg);
    err.paystackResponse = result;
    throw err;
  }

  return result.data;
}

/**
 * Initialize a Paystack checkout transaction for escrow collection
 * @param {Object} params
 * @param {string} params.email - Buyer email
 * @param {number} params.amountInGhs - Amount in GHS (e.g. 120.00)
 * @param {string} params.reference - Unique order reference
 * @param {string} params.callbackUrl - URL to redirect buyer after payment
 * @param {Object} params.metadata - Metadata (order_id, farmer_id, etc.)
 */
async function initializeTransaction({ email, amountInGhs, reference, callbackUrl, metadata = {} }) {
  const amountInPesewas = Math.round(Number(amountInGhs) * 100);

  const payload = {
    email: email || 'buyer@agrilink.gh',
    amount: amountInPesewas,
    currency: 'GHS',
    reference: reference || `AGR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    callback_url: callbackUrl,
    channels: ['card', 'mobile_money', 'bank', 'ussd', 'qr'],
    metadata: {
      ...metadata,
      platform: 'AgriLink Escrow',
    },
  };

  return await paystackRequest('/transaction/initialize', 'POST', payload);
}

/**
 * Verify a transaction using its reference
 * @param {string} reference - Paystack transaction reference
 */
async function verifyTransaction(reference) {
  return await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, 'GET');
}

/**
 * Map local Ghanaian payment provider names to Paystack bank codes
 */
function getGhanaProviderBankCode(provider) {
  const norm = (provider || '').toLowerCase();
  if (norm.includes('mtn')) return 'MTN';
  if (norm.includes('telecel') || norm.includes('vodafone') || norm.includes('vod')) return 'VOD';
  if (norm.includes('airteltigo') || norm.includes('airtel') || norm.includes('tigo') || norm.includes('atl')) return 'ATL';
  return 'MTN'; // Default fallback in Ghana
}

/**
 * Create or get a Paystack Transfer Recipient for a farmer's mobile money/bank
 * @param {Object} params
 * @param {string} params.name - Farmer account holder name
 * @param {string} params.accountNumber - Mobile money phone number or bank account
 * @param {string} params.paymentMethod - 'mtn_momo' | 'telecel_cash' | 'airteltigo' | 'bank'
 * @param {string} [params.bankCode] - Bank code if method is bank
 */
async function createTransferRecipient({ name, accountNumber, paymentMethod, bankCode }) {
  const isBank = paymentMethod === 'bank';
  const type = isBank ? 'nuban' : 'mobile_money';
  const selectedBankCode = isBank ? (bankCode || 'GH010100') : getGhanaProviderBankCode(paymentMethod);

  // Normalize Ghana phone number e.g. 024XXXXXXX or +23324XXXXXXX -> local 10 digits
  let cleanNumber = String(accountNumber || '').replace(/\s+/g, '').replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('233') && cleanNumber.length === 12) {
    cleanNumber = '0' + cleanNumber.slice(3);
  }

  const payload = {
    type,
    name: name || 'AgriLink Farmer',
    account_number: cleanNumber,
    bank_code: selectedBankCode,
    currency: 'GHS',
    description: `AgriLink Farmer Payout Recipient (${name})`,
  };

  return await paystackRequest('/transferrecipient', 'POST', payload);
}

/**
 * Initiate an Escrow Payout Transfer to a farmer via Paystack Transfer API
 * @param {Object} params
 * @param {number} params.amountInGhs - Amount to send in GHS (e.g. 114.00)
 * @param {string} params.recipientCode - Farmer's Paystack recipient code (e.g. 'RCP_xxx')
 * @param {string} params.reason - Transfer description/memo
 * @param {string} [params.reference] - Unique transfer reference
 */
async function initiateTransfer({ amountInGhs, recipientCode, reason, reference }) {
  const amountInPesewas = Math.round(Number(amountInGhs) * 100);

  const payload = {
    source: 'balance',
    amount: amountInPesewas,
    recipient: recipientCode,
    reason: reason || 'AgriLink Escrow Delivery Release',
    currency: 'GHS',
    reference: reference || `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };

  return await paystackRequest('/transfer', 'POST', payload);
}

/**
 * Verify Paystack webhook HMAC SHA512 signature
 * @param {string|Buffer} rawBody - Raw HTTP request body
 * @param {string} signature - Header 'x-paystack-signature'
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!signature) return false;
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

module.exports = {
  initializeTransaction,
  verifyTransaction,
  createTransferRecipient,
  initiateTransfer,
  verifyWebhookSignature,
  getGhanaProviderBankCode,
};

const https = require('https');

const SASUSYNC_API_KEY = process.env.SASUSYNC_API_KEY || 'ss_a8556df8ab5571d7d4766875957c626f77cf2d804186106092b6c3c8316365c4';
const SASUSYNC_SENDER_ID = process.env.SASUSYNC_SENDER_ID || 'Agrilink';

/**
 * Format a phone number to standard Ghanaian international format: 233XXXXXXXXX
 */
function formatGhanaPhone(phone) {
  if (!phone) return null;
  let clean = String(phone).trim().replace(/[\s\-\(\)\+]/g, '');

  // 024XXXXXXX -> 23324XXXXXXX
  if (clean.startsWith('0') && clean.length === 10) {
    clean = '233' + clean.slice(1);
  }
  // 24XXXXXXX -> 23324XXXXXXX
  else if (clean.length === 9) {
    clean = '233' + clean;
  }
  // Already 233XXXXXXXXX
  else if (clean.startsWith('233') && clean.length === 12) {
    // Valid as is
  }

  // Basic validation: 233 followed by 9 digits
  if (/^233\d{9}$/.test(clean)) {
    return clean;
  }
  return null;
}

/**
 * Send an SMS via SasuSync API (Live or Sandbox)
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient phone number(s)
 * @param {string} options.message - Text content (up to 650 chars)
 * @param {string} [options.sender] - Sender ID (defaults to Agrilink)
 * @param {boolean} [options.sandbox] - Force sandbox mode
 */
async function sendSMS({ to, message, sender = SASUSYNC_SENDER_ID, sandbox = false }) {
  return new Promise((resolve) => {
    try {
      const recipientList = Array.isArray(to) ? to : [to];
      const validRecipients = recipientList
        .map(formatGhanaPhone)
        .filter(Boolean);

      if (validRecipients.length === 0) {
        console.warn('[SasuSync SMS] No valid Ghanaian phone numbers provided:', to);
        return resolve({ success: false, error: 'Invalid phone number format. Must be a valid Ghanaian number.' });
      }

      const postData = JSON.stringify({
        sender: sender || 'Agrilink',
        recipients: validRecipients,
        message: message.trim(),
      });

      const endpoint = sandbox
        ? 'https://sms.sasusync.com/smssandbox/v1/send'
        : 'https://sms.sasusync.com/api/v1/send';

      const url = new URL(endpoint);

      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': SASUSYNC_API_KEY,
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 10000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const json = body ? JSON.parse(body) : {};
              if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`[SasuSync SMS] Sent to ${validRecipients.join(', ')}:`, json);
                return resolve({ success: true, data: json });
              }

              console.warn(`[SasuSync SMS] HTTP ${res.statusCode}:`, json.detail || body);
              return resolve({
                success: false,
                statusCode: res.statusCode,
                error: json.detail || json.message || body || 'SMS send failed',
              });
            } catch (parseErr) {
              return resolve({ success: false, error: body || 'Non-JSON response' });
            }
          });
        }
      );

      req.on('error', (err) => {
        console.error('[SasuSync SMS] Network error:', err.message);
        resolve({ success: false, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        console.error('[SasuSync SMS] Request timed out');
        resolve({ success: false, error: 'Request timed out' });
      });

      req.write(postData);
      req.end();
    } catch (err) {
      console.error('[SasuSync SMS] Unexpected error:', err.message);
      resolve({ success: false, error: err.message });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// HIGH-LEVEL NOTIFICATION HELPERS FOR AGRILINK
// ─────────────────────────────────────────────────────────────

/**
 * 1. ORDER PLACED & FUNDS IN ESCROW (To Farmer)
 */
async function notifyOrderPlacedFarmer({ farmerPhone, farmerName, orderNumber, totalAmount, buyerName }) {
  if (!farmerPhone) return null;
  const buyer = buyerName ? ` from ${buyerName}` : '';
  const message = `AgriLink: New Order #${orderNumber}${buyer}! GH₵ ${Number(totalAmount).toFixed(2)} is secured in AgriLink Escrow. Please prepare items for delivery.`;
  return sendSMS({ to: farmerPhone, message });
}

/**
 * 1b. ORDER PLACED & PAYMENT SECURED (To Buyer)
 */
async function notifyOrderPlacedBuyer({ buyerPhone, buyerName, orderNumber, totalAmount }) {
  if (!buyerPhone) return null;
  const message = `AgriLink: Payment of GH₵ ${Number(totalAmount).toFixed(2)} for Order #${orderNumber} is secured in Escrow. Your farmer has been notified to fulfill the order.`;
  return sendSMS({ to: buyerPhone, message });
}

/**
 * 2. ORDER MARKED AS DELIVERED (To Buyer)
 */
async function notifyOrderDeliveredBuyer({ buyerPhone, buyerName, orderNumber, farmerName }) {
  if (!buyerPhone) return null;
  const farmer = farmerName ? ` Farmer ${farmerName}` : ' The farmer';
  const message = `AgriLink Alert:${farmer} has marked Order #${orderNumber} as Delivered. Please inspect your produce and log in to confirm delivery to release the farmer's payout.`;
  return sendSMS({ to: buyerPhone, message });
}

/**
 * 3. BUYER CONFIRMED RECEIPT -> ESCROW PAYOUT RELEASED (To Farmer)
 */
async function notifyPayoutReleasedFarmer({ farmerPhone, farmerName, orderNumber, payoutAmount, momoNumber }) {
  if (!farmerPhone && !momoNumber) return null;
  const phone = farmerPhone || momoNumber;
  const message = `AgriLink Payout: Order #${orderNumber} confirmed by buyer! GH₵ ${Number(payoutAmount).toFixed(2)} has been released to your Mobile Money account. Thank you for selling on AgriLink!`;
  return sendSMS({ to: phone, message });
}

/**
 * 3b. DELIVERY CONFIRMATION (To Buyer)
 */
async function notifyPayoutReleasedBuyer({ buyerPhone, buyerName, orderNumber }) {
  if (!buyerPhone) return null;
  const message = `AgriLink: Thank you for confirming delivery of Order #${orderNumber}. Escrow payout has been transferred to the farmer. Enjoy your fresh produce!`;
  return sendSMS({ to: buyerPhone, message });
}

/**
 * 4. FARMER ACCOUNT VERIFICATION (To Farmer)
 */
async function notifyFarmerVerification({ farmerPhone, farmerName, status }) {
  if (!farmerPhone) return null;
  const name = farmerName ? ` ${farmerName}` : '';
  let message;
  if (status === 'verified') {
    message = `AgriLink: Congratulations${name}! Your farmer account has been officially Verified. You now have a verified seller badge on AgriLink Marketplace.`;
  } else if (status === 'rejected') {
    message = `AgriLink: Notice${name}: Your farmer verification was not approved. Please review your documents or contact AgriLink support for guidance.`;
  } else {
    message = `AgriLink: Your account verification status has been updated to: ${status}.`;
  }
  return sendSMS({ to: farmerPhone, message });
}

/**
 * 5. WELCOME SMS ON REGISTRATION
 */
async function notifyWelcome({ phone, name, role }) {
  if (!phone) return null;
  const roleLabel = role === 'farmer' ? 'Farmer' : 'Shopper';
  const message = `Welcome to AgriLink, ${name || 'friend'}! Your ${roleLabel} account is set up. Buy and sell farm-fresh produce safely with AgriLink Escrow.`;
  return sendSMS({ to: phone, message });
}

module.exports = {
  sendSMS,
  formatGhanaPhone,
  notifyOrderPlacedFarmer,
  notifyOrderPlacedBuyer,
  notifyOrderDeliveredBuyer,
  notifyPayoutReleasedFarmer,
  notifyPayoutReleasedBuyer,
  notifyFarmerVerification,
  notifyWelcome,
};

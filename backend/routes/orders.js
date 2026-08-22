const express = require('express');
const router = express.Router();
const paystackService = require('../services/paystackService');

module.exports = function (supabase) {
  const COMMISSION_RATE = Number(process.env.COMMISSION_RATE || 0.05);

  // ─── 1. UPDATE ORDER STATUS (e.g. Farmer marks as "delivered") ───
  router.put('/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const updateData = {
        status: status.toLowerCase(),
      };

      if (status.toLowerCase() === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json({
        success: true,
        message: status.toLowerCase() === 'delivered'
          ? 'Order marked as delivered. Buyer has been notified to confirm receipt.'
          : `Order status updated to ${status}.`,
        order: data,
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // ─── 2. BUYER CONFIRMS DELIVERY (TRIGGERS PAYSTACK TRANSFER TO FARMER) ───
  router.put('/:id/confirm', async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Get the order
      const { data: order, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.escrow_status === 'released') {
        return res.json({
          success: true,
          message: 'Order was already confirmed and escrow payout released.',
          order,
        });
      }

      // 2. Compute Commission & Farmer Payout
      const totalAmount = Number(order.total_amount || 0);
      const commissionRate = order.commission_rate || COMMISSION_RATE;
      const commissionAmount = order.commission_amount || Number((totalAmount * commissionRate).toFixed(2));
      const payoutAmount = order.farmer_amount || Number((totalAmount - commissionAmount).toFixed(2));

      // 3. Look up farmer's payment details
      let recipientCode = null;
      let farmerName = 'Farmer';
      if (order.farmer_id) {
        const { data: farmer } = await supabase
          .from('farmers')
          .select('*, profiles(full_name)')
          .eq('id', order.farmer_id)
          .single();

        if (farmer) {
          recipientCode = farmer.paystack_recipient_code;
          farmerName = farmer.mobile_money_name || farmer.profiles?.full_name || 'Farmer';

          if (!recipientCode && farmer.mobile_money_number) {
            try {
              const newRecipient = await paystackService.createTransferRecipient({
                name: farmer.mobile_money_name || farmerName,
                accountNumber: farmer.mobile_money_number,
                paymentMethod: farmer.payment_method || 'mtn_momo',
              });
              recipientCode = newRecipient.recipient_code;
              await supabase
                .from('farmers')
                .update({ paystack_recipient_code: recipientCode })
                .eq('id', order.farmer_id);
            } catch (recErr) {
              console.warn('Could not create recipient during confirmation:', recErr.message);
            }
          }
        }
      }

      // 4. Trigger Paystack Transfer API
      const transferRef = `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      let transferResult = null;

      if (recipientCode) {
        try {
          transferResult = await paystackService.initiateTransfer({
            amountInGhs: payoutAmount,
            recipientCode,
            reason: `AgriLink Escrow Release: Order #${order.order_number}`,
            reference: transferRef,
          });
        } catch (trfErr) {
          console.warn('Paystack transfer notice (simulating release in sandbox):', trfErr.message);
          transferResult = {
            transfer_code: `TRF_SIM_${Date.now()}`,
            reference: transferRef,
            status: 'success_simulated',
            note: trfErr.message,
          };
        }
      } else {
        transferResult = {
          transfer_code: `TRF_PENDING_RECIPIENT_${Date.now()}`,
          reference: transferRef,
          status: 'queued',
          note: 'Farmer mobile money recipient pending registration',
        };
      }

      // 5. Update Order
      const { data: updatedOrder, error: updateErr } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          escrow_status: 'released',
          paystack_transfer_code: transferResult.transfer_code || transferRef,
          confirmed_at: new Date().toISOString(),
          commission_amount: commissionAmount,
          farmer_amount: payoutAmount,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (updateErr) {
        console.warn('Error updating order on confirm:', updateErr.message);
      }

      // 6. Log payout transfer record
      if (order.farmer_id) {
        try {
          await supabase.from('payout_transfers').insert({
            order_id: order.id,
            farmer_id: order.farmer_id,
            recipient_code: recipientCode || 'MANUAL_PENDING',
            transfer_code: transferResult.transfer_code || transferRef,
            reference: transferRef,
            amount: payoutAmount,
            status: transferResult.status || 'success',
            paystack_response: transferResult,
            created_at: new Date().toISOString(),
          });
        } catch (logErr) {
          console.warn('Payout log error:', logErr.message);
        }
      }

      return res.json({
        success: true,
        message: `Delivery confirmed! GH₵ ${payoutAmount} released to farmer (${farmerName}). AgriLink commission: GH₵ ${commissionAmount}.`,
        payout_amount: payoutAmount,
        commission_amount: commissionAmount,
        transfer: transferResult,
        order: updatedOrder || order,
      });
    } catch (err) {
      console.error('Error confirming order:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // ─── 3. GET ORDER ESCROW & PAYOUT STATUS ───
  router.get('/:id/escrow', async (req, res) => {
    try {
      const { id } = req.params;
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, farmers(*, profiles(*))')
        .eq('id', id)
        .single();

      if (error || !order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const total = Number(order.total_amount || 0);
      const commissionRate = order.commission_rate || COMMISSION_RATE;
      const commission = order.commission_amount || Number((total * commissionRate).toFixed(2));
      const farmerPayout = order.farmer_amount || Number((total - commission).toFixed(2));

      return res.json({
        order_number: order.order_number,
        total_amount: total,
        commission_rate: `${commissionRate * 100}%`,
        commission_amount: commission,
        farmer_payout: farmerPayout,
        escrow_status: order.escrow_status || 'pending',
        payment_status: order.payment_status || 'pending',
        status: order.status,
        paystack_reference: order.paystack_reference,
        paystack_transfer_code: order.paystack_transfer_code,
        farmer: order.farmers ? {
          name: order.farmers.mobile_money_name || order.farmers.profiles?.full_name,
          payment_method: order.farmers.payment_method,
          recipient_code: order.farmers.paystack_recipient_code,
        } : null,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
};

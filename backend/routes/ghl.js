const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query } = require('../config/database');
const { sendEmail } = require('../utils/email');
const { syncContactToGHL } = require('../utils/ghl-api');

const router = express.Router();

// Verify webhook secret
function verifyWebhookSecret(req) {
  const secret = process.env.GHL_WEBHOOK_SECRET;
  if (!secret) return false;

  const headerSecret = req.headers['x-rvbot-webhook-secret'];
  const querySecret = req.query.secret;
  const provided = headerSecret || querySecret;

  return provided === secret;
}

// Extract email from GHL webhook payload
function extractEmail(payload) {
  const candidates = [
    payload.email,
    payload.contact?.email,
    payload.customer?.email,
    payload.data?.contact?.email,
    payload.data?.email
  ];

  for (const email of candidates) {
    if (email && typeof email === 'string' && email.includes('@')) {
      return email.toLowerCase();
    }
  }

  return null;
}

// Extract plan ID from payload
async function extractPlanId(payload) {
  // 1. Direct planId from custom data
  const directPlanId = payload.planId || payload.plan_id || 
                       payload.customData?.planId || payload.custom_data?.plan_id;
  
  if (directPlanId) {
    return parseInt(directPlanId);
  }

  // 2. Map from paymentLinkId
  const paymentLinkId = payload.paymentLinkId || payload.payment_link_id || 
                        payload.productId || payload.product_id;
  
  if (paymentLinkId) {
    // You can configure mapping in environment or database
    // For now, return null to try amount matching
  }

  // 3. Match by amount
  const amount = payload.amount || payload.total || payload.totalAmount;
  
  if (amount) {
    const amountFloat = parseFloat(amount);
    let cents = Math.round(amountFloat * 100);
    
    // If amount is already in cents (>= 1000)
    if (amountFloat >= 1000) {
      cents = Math.round(amountFloat);
    }

    const result = await query(
      'SELECT id FROM plans WHERE price_cents = $1 LIMIT 1',
      [cents]
    );

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
  }

  return null;
}

// GHL Payment Webhook
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook secret
    if (!verifyWebhookSecret(req)) {
      console.error('Invalid webhook secret');
      return res.status(401).json({ error: 'unauthorized' });
    }

    const payload = req.body;

    // Log webhook for debugging
    await query(
      'INSERT INTO webhook_logs (source, payload, status_code) VALUES ($1, $2, $3)',
      ['ghl', JSON.stringify(payload), 200]
    );

    // Extract email
    const email = extractEmail(payload);
    if (!email) {
      return res.status(400).json({ error: 'missing_email' });
    }

    // Extract name
    const name = payload.name || payload.contact?.name || payload.data?.contact?.name || '';

    // Extract plan ID
    const planId = await extractPlanId(payload);
    if (!planId) {
      return res.status(400).json({
        error: 'plan_not_detected',
        message: 'Could not determine plan. Add Custom Data: planId = 1 (or 2, 3) in your GHL workflow webhook.'
      });
    }

    // Check if user exists
    let userResult = await query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    let userId;
    let isNewUser = false;

    if (userResult.rows.length === 0) {
      // Create new user with random password
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const insertResult = await query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
        [email, passwordHash, name]
      );

      userId = insertResult.rows[0].id;
      isNewUser = true;

      // Send password reset email
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, resetToken, expiresAt]
      );

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      await sendEmail({
        to: email,
        subject: 'Welcome to RV Journey Genie - Set Your Password',
        text: `Hi ${name || 'there'},\n\nThanks for purchasing access to RV Journey Genie!\n\nClick the link below to set your password and log in:\n\n${resetUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nRV Journey Genie Team`
      });
    } else {
      userId = userResult.rows[0].id;
    }

    // Get plan details
    const planResult = await query(
      'SELECT duration_days FROM plans WHERE id = $1',
      [planId]
    );

    if (planResult.rows.length === 0) {
      return res.status(400).json({ error: 'invalid_plan_id' });
    }

    const durationDays = planResult.rows[0].duration_days;

    // Create subscription
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO subscriptions 
       (user_id, plan_id, start_date, end_date, status, provider, provider_ref) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, planId, startDate, endDate, 'active', 'ghl', payload.id || payload.orderId || '']
    );

    // Sync to GHL contact
    try {
      await syncContactToGHL(email, {
        name,
        tags: ['rv-bot-subscriber'],
        customFields: {
          subscription_status: 'active',
          subscription_plan_id: planId.toString(),
          subscription_end_date: endDate.toISOString()
        }
      });
    } catch (ghlError) {
      console.error('GHL sync error:', ghlError);
      // Don't fail the webhook if GHL sync fails
    }

    res.json({
      success: true,
      userId,
      planId,
      isNewUser
    });
  } catch (error) {
    console.error('GHL webhook error:', error);
    
    // Log error
    await query(
      'INSERT INTO webhook_logs (source, payload, error, status_code) VALUES ($1, $2, $3, $4)',
      ['ghl', JSON.stringify(req.body), error.message, 500]
    );

    res.status(500).json({ error: 'webhook_processing_failed' });
  }
});

// Test endpoint (only in development)
router.post('/test', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'not_found' });
  }

  try {
    const { email, planId, name, secret } = req.body;

    if (secret !== process.env.GHL_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (!email || !planId) {
      return res.status(400).json({ error: 'email_and_planId_required' });
    }

    // Simulate webhook payload
    const payload = {
      email,
      name: name || '',
      planId,
      id: `test_${Date.now()}`
    };

    // Forward to webhook handler
    req.body = payload;
    req.headers['x-rvbot-webhook-secret'] = secret;
    
    return router.handle({ ...req, method: 'POST', url: '/webhook' }, res);
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'test_failed' });
  }
});

module.exports = router;

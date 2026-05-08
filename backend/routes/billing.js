const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all plans
router.get('/plans', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, description, price_cents, currency, duration_days,
              tech_calls, tech_call_minutes, welcome_box
       FROM plans
       ORDER BY price_cents ASC`
    );

    const plans = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price_cents / 100,
      priceCents: row.price_cents,
      currency: row.currency,
      durationDays: row.duration_days,
      techCalls: row.tech_calls,
      techCallMinutes: row.tech_call_minutes,
      welcomeBox: row.welcome_box
    }));

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'failed_to_get_plans' });
  }
});

// Get user's subscription
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.id, s.plan_id, s.start_date, s.end_date, s.status,
              s.tech_calls_used, s.provider, s.current_period_end,
              p.name as plan_name, p.tech_calls, p.tech_call_minutes, p.welcome_box
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 
       AND s.status IN ('active', 'trialing')
       AND s.end_date > NOW()
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ subscription: null });
    }

    const sub = result.rows[0];

    res.json({
      subscription: {
        id: sub.id,
        planId: sub.plan_id,
        planName: sub.plan_name,
        startDate: sub.start_date,
        endDate: sub.end_date,
        status: sub.status,
        provider: sub.provider,
        techCalls: sub.tech_calls,
        techCallsUsed: sub.tech_calls_used,
        techCallsRemaining: sub.tech_calls - sub.tech_calls_used,
        techCallMinutes: sub.tech_call_minutes,
        welcomeBox: sub.welcome_box,
        currentPeriodEnd: sub.current_period_end
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'failed_to_get_subscription' });
  }
});

module.exports = router;

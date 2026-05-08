const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create lead
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      providerId,
      sessionId,
      leadType = 'contact',
      userLocation,
      referrerUrl
    } = req.body;

    if (!providerId) {
      return res.status(400).json({ error: 'provider_id_required' });
    }

    // Get provider details for conversion value
    const providerResult = await query(
      'SELECT lead_cost FROM service_providers WHERE id = $1',
      [providerId]
    );

    if (providerResult.rows.length === 0) {
      return res.status(404).json({ error: 'provider_not_found' });
    }

    const leadCost = providerResult.rows[0].lead_cost || 0;

    // Get user IP
    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Create lead
    const result = await query(
      `INSERT INTO leads 
       (provider_id, user_id, session_id, lead_type, user_location, user_ip, 
        referrer_url, conversion_value, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        providerId,
        req.user.userId,
        sessionId,
        leadType,
        userLocation,
        userIp,
        referrerUrl,
        leadCost,
        'pending'
      ]
    );

    res.json({
      success: true,
      leadId: result.rows[0].id
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'failed_to_create_lead' });
  }
});

module.exports = router;

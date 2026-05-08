const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const { sendEmail } = require('../utils/email');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'email_and_password_required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'password_too_short' });
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'email_exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email.toLowerCase(), passwordHash, name || '']
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email
    await sendEmail({
      to: email,
      subject: 'Welcome to RV Journey Genie',
      text: `Hi ${name || 'there'},\n\nWelcome to RV Journey Genie! Your account has been created successfully.\n\nYou can now log in and start chatting with our AI assistant.\n\nBest regards,\nRV Journey Genie Team`
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'registration_failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email_and_password_required' });
    }

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'login_failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.name, u.created_at,
              s.id as subscription_id, s.plan_id, s.start_date, s.end_date, 
              s.status, s.tech_calls_used,
              p.name as plan_name, p.tech_calls, p.tech_call_minutes, p.welcome_box
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status IN ('active', 'trialing') AND s.end_date > NOW()
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE u.id = $1
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      subscription: user.subscription_id ? {
        id: user.subscription_id,
        planId: user.plan_id,
        planName: user.plan_name,
        startDate: user.start_date,
        endDate: user.end_date,
        status: user.status,
        techCalls: user.tech_calls,
        techCallsUsed: user.tech_calls_used,
        techCallsRemaining: user.tech_calls - user.tech_calls_used,
        techCallMinutes: user.tech_call_minutes,
        welcomeBox: user.welcome_box
      } : null
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'failed_to_get_user' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email_required' });
    }

    // Find user
    const result = await query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'password_reset_email_sent' });
    }

    const user = result.rows[0];

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token
    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Reset your password - RV Journey Genie',
      text: `Hi ${user.name || 'there'},\n\nYou requested to reset your password.\n\nClick the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't request this, you can ignore this email.\n\nBest regards,\nRV Journey Genie Team`
    });

    res.json({ message: 'password_reset_email_sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'failed_to_send_reset_email' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'token_and_password_required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'password_too_short' });
    }

    // Find valid token
    const result = await query(
      `SELECT prt.id, prt.user_id, u.email, u.name
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1 AND prt.expires_at > NOW() AND prt.used = FALSE`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'invalid_or_expired_token' });
    }

    const resetToken = result.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, resetToken.user_id]
    );

    // Mark token as used
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
      [resetToken.id]
    );

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: resetToken.user_id, email: resetToken.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'password_reset_successful',
      token: jwtToken,
      user: {
        id: resetToken.user_id,
        email: resetToken.email,
        name: resetToken.name
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'failed_to_reset_password' });
  }
});

module.exports = router;

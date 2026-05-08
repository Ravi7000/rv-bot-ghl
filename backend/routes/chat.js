const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { callOpenAI, callGemini } = require('../utils/ai-providers');

const router = express.Router();

// Check user has active subscription
async function hasActiveSubscription(userId) {
  const result = await query(
    `SELECT id FROM subscriptions 
     WHERE user_id = $1 
     AND status IN ('active', 'trialing') 
     AND end_date > NOW()
     LIMIT 1`,
    [userId]
  );
  return result.rows.length > 0;
}

// Create new chat session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessionId = `${req.user.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await query(
      'INSERT INTO chat_sessions (user_id, session_id) VALUES ($1, $2)',
      [req.user.userId, sessionId]
    );

    res.json({ sessionId });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'failed_to_create_session' });
  }
});

// Get user's chat sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT session_id, title, created_at, updated_at
       FROM chat_sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 50`,
      [req.user.userId]
    );

    const sessions = result.rows.map(row => ({
      sessionId: row.session_id,
      title: row.title || 'New Chat',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'failed_to_get_sessions' });
  }
});

// Get session messages
router.get('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session belongs to user
    const sessionCheck = await query(
      'SELECT id FROM chat_sessions WHERE session_id = $1 AND user_id = $2',
      [sessionId, req.user.userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'session_not_found' });
    }

    const result = await query(
      `SELECT message_type, content, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    const messages = result.rows.map(row => ({
      role: row.message_type,
      content: row.content,
      timestamp: row.created_at
    }));

    res.json({ sessionId, messages });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'failed_to_get_session' });
  }
});

// Delete session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Delete messages first
    await query('DELETE FROM chat_messages WHERE session_id = $1', [sessionId]);
    
    // Delete session
    const result = await query(
      'DELETE FROM chat_sessions WHERE session_id = $1 AND user_id = $2',
      [sessionId, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'session_not_found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'failed_to_delete_session' });
  }
});

// Send chat message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message, sessionId, history = [], stream = true } = req.body;

    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'empty_message' });
    }

    if (message.length > 4000) {
      return res.status(413).json({ error: 'message_too_long' });
    }

    // Check subscription
    const hasSubscription = await hasActiveSubscription(req.user.userId);
    if (!hasSubscription) {
      return res.status(403).json({
        error: 'no_access',
        message: 'Active subscription required'
      });
    }

    // Save user message
    if (sessionId) {
      await query(
        'INSERT INTO chat_messages (session_id, message_type, content) VALUES ($1, $2, $3)',
        [sessionId, 'user', message]
      );
    }

    // Get AI provider from env
    const provider = process.env.AI_PROVIDER || 'openai';
    const systemPrompt = process.env.SYSTEM_PROMPT || 'You are an AI assistant specialized in RV maintenance and repair.';

    // Prepare history (last 8 messages)
    const sanitizedHistory = history.slice(-8).map(h => ({
      role: h.role,
      content: h.content.substring(0, 2000)
    }));

    if (stream) {
      // Set up streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      let fullResponse = '';

      const streamCallback = (chunk) => {
        if (chunk === '[DONE]') {
          res.write(`data: [DONE]\n\n`);
          res.end();
          
          // Save assistant response
          if (sessionId && fullResponse) {
            query(
              'INSERT INTO chat_messages (session_id, message_type, content) VALUES ($1, $2, $3)',
              [sessionId, 'assistant', fullResponse]
            ).then(() => {
              // Update session title if first message
              return query(
                'SELECT COUNT(*) as count FROM chat_messages WHERE session_id = $1',
                [sessionId]
              );
            }).then(result => {
              if (result.rows[0].count <= 2) {
                const words = message.split(' ').slice(0, 6).join(' ');
                const title = words.replace(/[^\w\s-]/g, '').substring(0, 50);
                if (title) {
                  return query(
                    'UPDATE chat_sessions SET title = $1 WHERE session_id = $2',
                    [title, sessionId]
                  );
                }
              }
            }).catch(err => console.error('Error saving message:', err));
          }
        } else {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      };

      try {
        if (provider === 'gemini') {
          await callGemini(systemPrompt, sanitizedHistory, message, streamCallback);
        } else {
          await callOpenAI(systemPrompt, sanitizedHistory, message, streamCallback);
        }
      } catch (error) {
        console.error('AI provider error:', error);
        res.write(`data: ${JSON.stringify({
          error: 'provider_error',
          message: error.message
        })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response
      try {
        let responseText;
        if (provider === 'gemini') {
          responseText = await callGemini(systemPrompt, sanitizedHistory, message);
        } else {
          responseText = await callOpenAI(systemPrompt, sanitizedHistory, message);
        }

        // Save assistant response
        if (sessionId) {
          await query(
            'INSERT INTO chat_messages (session_id, message_type, content) VALUES ($1, $2, $3)',
            [sessionId, 'assistant', responseText]
          );

          // Update session title if first message
          const countResult = await query(
            'SELECT COUNT(*) as count FROM chat_messages WHERE session_id = $1',
            [sessionId]
          );

          if (countResult.rows[0].count <= 2) {
            const words = message.split(' ').slice(0, 6).join(' ');
            const title = words.replace(/[^\w\s-]/g, '').substring(0, 50);
            if (title) {
              await query(
                'UPDATE chat_sessions SET title = $1 WHERE session_id = $2',
                [title, sessionId]
              );
            }
          }
        }

        res.json({
          message: responseText,
          sessionId
        });
      } catch (error) {
        console.error('AI provider error:', error);
        const statusCode = error.message.includes('429') ? 429 : 500;
        res.status(statusCode).json({
          error: 'provider_error',
          message: error.message
        });
      }
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'chat_failed' });
  }
});

module.exports = router;

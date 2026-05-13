// Minimal working backend for Vercel
const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'RV Bot Backend is running!',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Simple auth test (no database)
app.post('/api/auth/test', (req, res) => {
  res.json({ 
    message: 'Auth endpoint working!',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Mock register endpoint (for testing frontend)
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  // Mock successful registration
  res.json({
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: 1,
      email: email,
      name: name || 'Test User'
    }
  });
});

// Mock login endpoint (for testing frontend)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  // Mock successful login
  res.json({
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: 1,
      email: email,
      name: 'Test User'
    }
  });
});

// Mock chat endpoints
app.get('/api/chat/sessions', (req, res) => {
  // Mock chat sessions
  res.json([
    {
      sessionId: 'session-1',
      title: 'RV Maintenance Help',
      updatedAt: new Date().toISOString()
    },
    {
      sessionId: 'session-2', 
      title: 'Engine Troubleshooting',
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]);
});

app.get('/api/chat/sessions/:sessionId', (req, res) => {
  // Mock chat messages
  res.json({
    messages: [
      {
        role: 'user',
        content: 'Hello, I need help with my RV engine'
      },
      {
        role: 'assistant', 
        content: 'Hi! I\'d be happy to help you with your RV engine. What specific issue are you experiencing?'
      }
    ]
  });
});

app.post('/api/chat/sessions', (req, res) => {
  // Create new session
  res.json({
    sessionId: 'session-' + Date.now()
  });
});

app.post('/api/chat', (req, res) => {
  const { message, sessionId } = req.body;
  
  // Mock AI response
  const responses = [
    "That's a great question about RV maintenance! Let me help you with that.",
    "Based on your description, it sounds like a common RV issue. Here's what I recommend...",
    "For RV engine problems, the first thing to check is usually the fuel system.",
    "RV electrical issues can be tricky, but let's troubleshoot step by step.",
    "Regular maintenance is key for RV longevity. Here are some tips..."
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  res.json({
    message: randomResponse,
    sessionId: sessionId
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

module.exports = app;
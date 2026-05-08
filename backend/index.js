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
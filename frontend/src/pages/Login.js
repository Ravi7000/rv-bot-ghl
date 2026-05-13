import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rvbot-auth-page">
      <div className="rvbot-modal-content small">
        <div className="rvbot-modal-header">
          <h2>Welcome Back</h2>
          <p>Log in to continue to RV Journey Genie</p>
        </div>

        {error ? <div className="rvbot-auth-error">{error}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="rvbot-auth-row">
            <input
              type="email"
              className="rvbot-input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              autoComplete="email"
            />
          </div>
          <div className="rvbot-auth-row">
            <input
              type="password"
              className="rvbot-input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              autoComplete="current-password"
            />
          </div>
          <div className="rvbot-auth-row">
            <button type="submit" className="rvbot-btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        </form>

        <div className="rvbot-auth-toggle">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;

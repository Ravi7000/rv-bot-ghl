import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rvbot-auth-page">
      <div className="rvbot-modal-content small">
        <div className="rvbot-modal-header">
          <h2>Create Account</h2>
          <p>Sign up to start using RV Journey Genie</p>
        </div>

        {error ? <div className="rvbot-auth-error">{error}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="rvbot-auth-row">
            <input
              type="text"
              className="rvbot-input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </div>
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
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="rvbot-auth-row">
            <button type="submit" className="rvbot-btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="rvbot-auth-toggle">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;

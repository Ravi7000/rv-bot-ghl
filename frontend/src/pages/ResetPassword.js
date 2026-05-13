import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
      const response = await api.post('/auth/reset-password', { token, password });
      localStorage.setItem('token', response.data.token);
      setSuccess(true);
      setTimeout(() => navigate('/chat'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="rvbot-auth-page">
        <div className="rvbot-modal-content small">
          <div className="rvbot-modal-header">
            <h2>Invalid Link</h2>
            <p>This password reset link is invalid or has expired.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rvbot-auth-page">
      <div className="rvbot-modal-content small">
        <div className="rvbot-modal-header">
          <h2>Set Your Password</h2>
          <p>Choose a strong password for your account</p>
        </div>

        {error ? <div className="rvbot-auth-error">{error}</div> : null}
        {success ? (
          <div className="rvbot-auth-error" style={{ background: '#d1fae5', borderColor: '#a7f3d0', color: '#065f46' }}>
            Password set successfully! Redirecting...
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="rvbot-auth-row">
            <input
              type="password"
              className="rvbot-input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="New password"
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="rvbot-auth-row">
            <button type="submit" className="rvbot-btn" style={{ width: '100%' }} disabled={loading || success}>
              {loading ? 'Setting password...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;

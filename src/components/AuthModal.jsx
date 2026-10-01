import React, { useState } from 'react';
import { X, Lock, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthModal = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, loginUser, navigate } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await loginUser(email.trim(), password);
      if (res && res.error) {
        setErrorMsg(res.error);
      } else {
        setIsAuthModalOpen(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gt-modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
      <div
        className="gt-modal-box"
        style={{ maxWidth: '400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gt-modal-header">
          <div>
            <h3 className="gt-modal-title">Sign In to GharTak</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
              Fast delivery in Hailakandi, Assam
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="gt-icon-btn"
            style={{ width: '32px', height: '32px' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="gt-modal-body">
          {errorMsg && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: 'var(--gt-radius-md)',
                color: '#B91C1C',
                fontSize: '0.8125rem',
                marginBottom: '14px',
                fontWeight: 500
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--gt-text-secondary)'
                }}
              >
                Email Address
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--gt-bg-surface)',
                  border: '1.5px solid var(--gt-border-default)',
                  borderRadius: 'var(--gt-radius-lg)',
                  padding: '0 12px',
                  height: '44px'
                }}
              >
                <Smartphone size={16} color="var(--gt-text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    backgroundColor: 'transparent'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--gt-text-secondary)'
                }}
              >
                Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--gt-bg-surface)',
                  border: '1.5px solid var(--gt-border-default)',
                  borderRadius: 'var(--gt-radius-lg)',
                  padding: '0 12px',
                  height: '44px'
                }}
              >
                <Lock size={16} color="var(--gt-text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    backgroundColor: 'transparent'
                  }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="gt-btn gt-btn-primary gt-btn-full"
              style={{ marginBottom: '12px' }}
            >
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(false);
                  navigate('register');
                }}
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--gt-primary)',
                  fontWeight: 600
                }}
              >
                New user? Create an account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

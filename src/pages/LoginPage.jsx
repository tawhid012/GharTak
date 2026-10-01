import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Smartphone, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginPage = () => {
  const { loginUser, navigate, goBack } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await loginUser(email.trim(), password);
      if (res && res.error) {
        setErrorMessage(res.error);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="gt-container"
      style={{
        paddingTop: '32px',
        paddingBottom: '48px',
        maxWidth: '440px',
        minHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate('home')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '20px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--gt-text-secondary)',
          width: 'fit-content'
        }}
        aria-label="Back to Marketplace"
      >
        <ArrowLeft size={16} />
        <span>Marketplace Home</span>
      </button>

      {/* Login Card */}
      <div
        style={{
          backgroundColor: 'var(--gt-bg-surface)',
          borderRadius: 'var(--gt-radius-2xl)',
          padding: '32px 28px',
          border: '1px solid var(--gt-border-subtle)',
          boxShadow: 'var(--gt-shadow-md)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/brand/primary.png"
            alt="GHARTAK"
            style={{ height: '42px', margin: '0 auto 16px', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <h1
            style={{
              display: 'none',
              fontFamily: 'var(--gt-font-display)',
              fontWeight: 800,
              fontSize: '1.6rem',
              letterSpacing: '-0.03em',
              marginBottom: '4px'
            }}
          >
            GHAR<span style={{ color: 'var(--gt-primary)' }}>TAK</span>
          </h1>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gt-text-primary)', marginBottom: '6px' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gt-text-muted)' }}>
            Sign in to continue shopping with GharTak.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--gt-radius-md)',
              color: '#B91C1C',
              fontSize: '0.8125rem',
              marginBottom: '16px',
              fontWeight: 500
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Address */}
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
                height: '46px',
                transition: 'border-color 0.2s'
              }}
            >
              <Smartphone size={18} color="var(--gt-text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
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

          {/* Password */}
          <div style={{ marginBottom: '22px' }}>
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
                height: '46px'
              }}
            >
              <Lock size={18} color="var(--gt-text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
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

          {/* Primary Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="gt-btn gt-btn-primary gt-btn-full"
            style={{ height: '48px', marginBottom: '18px' }}
          >
            <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Secondary: Consumer Registration */}
        <div style={{ textAlign: 'center', paddingTop: '14px', borderTop: '1px solid var(--gt-border-subtle)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--gt-text-secondary)' }}>
            New to GharTak?{' '}
            <button
              onClick={() => navigate('register')}
              style={{
                color: 'var(--gt-primary)',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              Create an account
            </button>
          </p>
        </div>
      </div>

      {/* Trust Guarantee */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '20px',
          fontSize: '0.8125rem',
          color: 'var(--gt-text-muted)'
        }}
      >
        <ShieldCheck size={16} color="var(--gt-success)" />
        <span>Secure & encrypted login with GharTak</span>
      </div>
    </div>
  );
};

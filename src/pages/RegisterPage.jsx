import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Phone, Mail, Lock, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const RegisterPage = () => {
  const { registerConsumer, navigate } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    termsAccepted: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;
    if (!formData.termsAccepted) return;

    setIsSubmitting(true);
    try {
      await registerConsumer(formData);
    } catch (err) {
      console.error('Registration error:', err);
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
        maxWidth: '460px',
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

      {/* Registration Card */}
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
            style={{ height: '40px', margin: '0 auto 16px', objectFit: 'contain' }}
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
            Create an account
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gt-text-muted)' }}>
            Join GharTak for instant grocery & essentials delivery in Hailakandi.
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'var(--gt-text-secondary)'
              }}
            >
              Full Name
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
              <User size={18} color="var(--gt-text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

          {/* Phone Number */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'var(--gt-text-secondary)'
              }}
            >
              Mobile Number
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--gt-bg-surface)',
                border: '1.5px solid var(--gt-border-default)',
                borderRadius: 'var(--gt-radius-lg)',
                overflow: 'hidden',
                height: '46px'
              }}
            >
              <span
                style={{
                  padding: '0 10px',
                  backgroundColor: 'var(--gt-bg-card-hover)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--gt-text-secondary)',
                  borderRight: '1px solid var(--gt-border-subtle)',
                  lineHeight: '46px'
                }}
              >
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                placeholder="Enter 10-digit number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '0 12px',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  backgroundColor: 'transparent'
                }}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '14px' }}>
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
                height: '46px'
              }}
            >
              <Mail size={18} color="var(--gt-text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
              <input
                type="email"
                placeholder="e.g. rahul@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'var(--gt-text-secondary)'
              }}
            >
              Create Password
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
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

          {/* Terms Acceptance */}
          <div
            onClick={() => setFormData({ ...formData, termsAccepted: !formData.termsAccepted })}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '22px',
              cursor: 'pointer'
            }}
          >
            {formData.termsAccepted ? (
              <CheckSquare size={18} color="var(--gt-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
            ) : (
              <Square size={18} color="var(--gt-text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)', lineHeight: 1.4 }}>
              I agree to GharTak's <strong>Terms of Service</strong> and <strong>Privacy Policy</strong> for Hailakandi, Assam.
            </span>
          </div>

          {/* Create Account CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.termsAccepted}
            className="gt-btn gt-btn-primary gt-btn-full"
            style={{ height: '48px', marginBottom: '18px' }}
          >
            <span>{isSubmitting ? 'Creating Account...' : 'Create account'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Existing account link */}
        <div style={{ textAlign: 'center', paddingTop: '14px', borderTop: '1px solid var(--gt-border-subtle)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--gt-text-secondary)' }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('login')}
              style={{
                color: 'var(--gt-primary)',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Store, CheckCircle2, ShieldCheck, MapPin, Clock, Phone, Mail, User, Building } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VendorRegisterPage = () => {
  const { submitVendorApplication, navigate } = useApp();

  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    email: '',
    storeName: '',
    category: 'Groceries & Supermarket',
    address: '',
    city: 'Hailakandi',
    operatingHours: '08:00 AM - 09:00 PM'
  });

  const [submittedApp, setSubmittedApp] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ownerName || !formData.storeName || !formData.phone) return;

    setIsSubmitting(true);
    try {
      const res = await submitVendorApplication(formData);
      if (res.success) {
        setSubmittedApp(res.application);
      }
    } catch (err) {
      console.error('Vendor application error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'Groceries & Supermarket',
    'Dairy & Bakery',
    'Pharmacy & Wellness',
    'Food & Beverages',
    'Assam Specials & Spices',
    'Electronics & Mobiles',
    'Fashion & Apparel',
    'Home & Utilities'
  ];

  return (
    <div
      className="gt-container"
      style={{
        paddingTop: '32px',
        paddingBottom: '56px',
        maxWidth: '580px'
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

      {/* Confirmation State if submitted */}
      {submittedApp ? (
        <div
          style={{
            backgroundColor: 'var(--gt-bg-surface)',
            borderRadius: 'var(--gt-radius-2xl)',
            padding: '36px 30px',
            border: '1px solid var(--gt-border-subtle)',
            boxShadow: 'var(--gt-shadow-md)',
            textAlign: 'center',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: 'var(--gt-radius-full)',
              backgroundColor: 'var(--gt-success-light)',
              color: 'var(--gt-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 0 8px rgba(16, 185, 129, 0.1)'
            }}
          >
            <CheckCircle2 size={38} />
          </div>

          <span className="gt-badge gt-badge-orange" style={{ marginBottom: '12px' }}>
            Application Received
          </span>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
            Application received
          </h1>
          <p style={{ color: 'var(--gt-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: '24px' }}>
            Your GharTak partner application has been submitted for <strong>{submittedApp.storeName}</strong>.
          </p>

          {/* Reference Card */}
          <div
            style={{
              backgroundColor: 'var(--gt-bg-card-hover)',
              borderRadius: 'var(--gt-radius-xl)',
              padding: '18px 20px',
              textAlign: 'left',
              marginBottom: '28px',
              border: '1px solid var(--gt-border-subtle)',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gt-text-muted)' }}>Reference Number</span>
              <strong style={{ fontFamily: 'var(--gt-font-display)', color: 'var(--gt-primary)' }}>
                #{submittedApp.id}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gt-text-muted)' }}>Store Name</span>
              <strong>{submittedApp.storeName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gt-text-muted)' }}>Location</span>
              <span>{submittedApp.address}, {submittedApp.city}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gt-text-muted)' }}>Review Timeline</span>
              <strong style={{ color: 'var(--gt-success)' }}>24–48 Business Hours</strong>
            </div>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', marginBottom: '24px' }}>
            Our local Hailakandi merchant relations manager will contact you at <strong>{submittedApp.phone}</strong> to verify catalog details and provide your store tablet onboarding kit.
          </p>

          <button
            onClick={() => navigate('home')}
            className="gt-btn gt-btn-primary gt-btn-full"
          >
            Return to GharTak Marketplace
          </button>
        </div>
      ) : (
        /* Main Vendor Application Form */
        <div
          style={{
            backgroundColor: 'var(--gt-bg-surface)',
            borderRadius: 'var(--gt-radius-2xl)',
            padding: '36px 30px',
            border: '1px solid var(--gt-border-subtle)',
            boxShadow: 'var(--gt-shadow-md)',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Partnership Banner Header */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                backgroundColor: 'var(--gt-primary-surface)',
                color: 'var(--gt-primary)',
                borderRadius: 'var(--gt-radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '10px'
              }}
            >
              <Store size={14} />
              <span>GharTak Merchant Partnership</span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gt-text-primary)', marginBottom: '8px' }}>
              Grow your business with GharTak.
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--gt-text-secondary)', lineHeight: 1.5 }}>
              Put your store in front of customers nearby and let GharTak help bring orders to their doorstep.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Section 1: Store Information */}
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--gt-text-muted)',
                marginBottom: '12px'
              }}
            >
              Store Information
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Store Name
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
                <Store size={18} color="var(--gt-text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="e.g. Paul Grocery & Daily Needs"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9375rem', backgroundColor: 'transparent' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Store Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 12px',
                  borderRadius: 'var(--gt-radius-lg)',
                  border: '1.5px solid var(--gt-border-default)',
                  backgroundColor: 'var(--gt-bg-surface)',
                  fontSize: '0.9375rem',
                  outline: 'none'
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Store Address in Hailakandi
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
                <MapPin size={18} color="var(--gt-text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="e.g. Station Road, Near Circuit House"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9375rem', backgroundColor: 'transparent' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  City / Market
                </label>
                <input
                  type="text"
                  value={formData.city}
                  disabled
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 12px',
                    borderRadius: 'var(--gt-radius-lg)',
                    border: '1.5px solid var(--gt-border-subtle)',
                    backgroundColor: 'var(--gt-bg-card-hover)',
                    fontSize: '0.9375rem',
                    color: 'var(--gt-text-secondary)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 12px',
                    borderRadius: 'var(--gt-radius-lg)',
                    border: '1.5px solid var(--gt-border-default)',
                    backgroundColor: 'var(--gt-bg-surface)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
            </div>

            {/* Section 2: Owner Details */}
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--gt-text-muted)',
                marginBottom: '12px'
              }}
            >
              Owner & Contact Details
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Owner Full Name
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
                  placeholder="e.g. Bikram Debnath"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9375rem', backgroundColor: 'transparent' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 12px',
                    borderRadius: 'var(--gt-radius-lg)',
                    border: '1.5px solid var(--gt-border-default)',
                    backgroundColor: 'var(--gt-bg-surface)',
                    fontSize: '0.9375rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="store@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 12px',
                    borderRadius: 'var(--gt-radius-lg)',
                    border: '1.5px solid var(--gt-border-default)',
                    backgroundColor: 'var(--gt-bg-surface)',
                    fontSize: '0.9375rem'
                  }}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="gt-btn gt-btn-primary gt-btn-full"
              style={{ height: '48px', marginBottom: '14px' }}
            >
              <span>{isSubmitting ? 'Submitting Application...' : 'Apply as a Vendor'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

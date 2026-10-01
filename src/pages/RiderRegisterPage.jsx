import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Bike, CheckCircle2, ShieldCheck, MapPin, Phone, Mail, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const RiderRegisterPage = () => {
  const { submitRiderApplication, navigate } = useApp();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    vehicleType: 'Motorcycle',
    city: 'Hailakandi'
  });

  const [submittedApp, setSubmittedApp] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) return;

    setIsSubmitting(true);
    try {
      const res = await submitRiderApplication(formData);
      if (res.success) {
        setSubmittedApp(res.application);
      }
    } catch (err) {
      console.error('Rider application error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehicleTypes = [
    'Motorcycle (e.g. Hero Splendor, Bajaj Pulsar)',
    'Scooter (e.g. Honda Activa, TVS Jupiter)',
    'Electric Scooter / EV Bike',
    'Bicycle'
  ];

  return (
    <div
      className="gt-container"
      style={{
        paddingTop: '32px',
        paddingBottom: '56px',
        maxWidth: '540px'
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
            Your rider partner application has been submitted, <strong>{submittedApp.fullName}</strong>.
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
              <span style={{ color: 'var(--gt-text-muted)' }}>Reference ID</span>
              <strong style={{ fontFamily: 'var(--gt-font-display)', color: 'var(--gt-primary)' }}>
                #{submittedApp.id}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gt-text-muted)' }}>Applicant</span>
              <strong>{submittedApp.fullName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gt-text-muted)' }}>City Fleet</span>
              <span>Hailakandi, Assam</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gt-text-muted)' }}>Vehicle Registered</span>
              <span style={{ maxWidth: '240px', textAlign: 'right' }}>{submittedApp.vehicleType}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', marginBottom: '24px' }}>
            Our local Hailakandi fleet coordinator will call you at <strong>{submittedApp.phone}</strong> within 24 hours to schedule document verification and hand over your GharTak delivery bag & T-shirt.
          </p>

          <button
            onClick={() => navigate('home')}
            className="gt-btn gt-btn-primary gt-btn-full"
          >
            Return to GharTak Marketplace
          </button>
        </div>
      ) : (
        /* Main Rider Application Form */
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
              <Bike size={14} />
              <span>GharTak Delivery Partner</span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gt-text-primary)', marginBottom: '8px' }}>
              Ride with GharTak.
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--gt-text-secondary)', lineHeight: 1.5 }}>
              Deliver orders around your city and earn with GharTak. Weekly payouts, flexible hours, and delivery incentives in Hailakandi.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
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
                  placeholder="e.g. Rahul Das"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9375rem', backgroundColor: 'transparent' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
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
                  placeholder="name@email.com"
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

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Residential Address in Hailakandi
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
                  placeholder="e.g. Ward No. 3, Near Civil Hospital"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9375rem', backgroundColor: 'transparent' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                Vehicle Type
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
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
                {vehicleTypes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
                City Operating Fleet
              </label>
              <input
                type="text"
                value="Hailakandi, Assam"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="gt-btn gt-btn-primary gt-btn-full"
              style={{ height: '48px', marginBottom: '14px' }}
            >
              <span>{isSubmitting ? 'Submitting Application...' : 'Apply as a Rider'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

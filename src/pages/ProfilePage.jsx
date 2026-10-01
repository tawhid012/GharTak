import React, { useState } from 'react';
import { User, Phone, MapPin, CreditCard, Heart, Bell, HelpCircle, Settings, LogOut, ChevronRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProfilePage = () => {
  const { user, logout, setIsAuthModalOpen, addresses, deleteAddress, favourites, navigate, showToast } = useApp();
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <div className="gt-container" style={{ paddingTop: '20px', maxWidth: '640px' }}>
      {/* Profile Header Card */}
      <div
        style={{
          backgroundColor: 'var(--gt-bg-surface)',
          borderRadius: 'var(--gt-radius-2xl)',
          padding: '24px 20px',
          border: '1px solid var(--gt-border-subtle)',
          boxShadow: 'var(--gt-shadow-xs)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: 'var(--gt-radius-full)',
            overflow: 'hidden',
            border: '2px solid var(--gt-primary)',
            backgroundColor: '#F8F6F2',
            flexShrink: 0
          }}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={32} color="var(--gt-primary)" />
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gt-text-primary)' }}>
            {user?.name || 'Guest User'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gt-text-muted)', marginTop: '2px' }}>
            {user?.phone || '+91 98765 43210'}
          </p>
          <span className="gt-badge gt-badge-orange" style={{ marginTop: '6px' }}>
            📍 Hailakandi, Assam
          </span>
        </div>

        {user ? (
          <button
            onClick={logout}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--gt-radius-full)',
              border: '1px solid var(--gt-border-default)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#EF4444'
            }}
          >
            Log Out
          </button>
        ) : (
          <button
            onClick={() => navigate('login')}
            className="gt-btn gt-btn-primary gt-btn-sm"
          >
            Log In
          </button>
        )}
      </div>

      {/* Quick Navigation Rows */}
      <div
        style={{
          backgroundColor: 'var(--gt-bg-surface)',
          borderRadius: 'var(--gt-radius-2xl)',
          overflow: 'hidden',
          border: '1px solid var(--gt-border-subtle)',
          boxShadow: 'var(--gt-shadow-xs)',
          marginBottom: '24px'
        }}
      >
        <button
          onClick={() => navigate('orders')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--gt-border-subtle)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--gt-radius-full)', backgroundColor: 'var(--gt-primary-surface)', color: 'var(--gt-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Order History</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>View recent orders and invoices</div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--gt-text-muted)" />
        </button>

        <button
          onClick={() => navigate('saved')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--gt-border-subtle)',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--gt-radius-full)', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Favourites & Saved</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>{favourites.length} saved products</div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--gt-text-muted)" />
        </button>

        <button
          onClick={() => setShowSupportModal(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--gt-radius-full)', backgroundColor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Help & Support</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>FAQs, customer care in Hailakandi</div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--gt-text-muted)" />
        </button>
      </div>

      {/* Saved Delivery Addresses */}
      <div
        style={{
          backgroundColor: 'var(--gt-bg-surface)',
          borderRadius: 'var(--gt-radius-2xl)',
          padding: '20px',
          border: '1px solid var(--gt-border-subtle)',
          boxShadow: 'var(--gt-shadow-xs)',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Saved Addresses ({addresses.length})</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>Hailakandi</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--gt-radius-lg)',
                backgroundColor: 'var(--gt-bg-card-hover)',
                border: '1px solid var(--gt-border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={18} color="var(--gt-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    {addr.label} {addr.isDefault && <span style={{ color: 'var(--gt-primary)', fontSize: '0.75rem' }}>(Default)</span>}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)' }}>
                    {addr.line1}, {addr.locality}, {addr.city} — {addr.pincode}
                  </div>
                </div>
              </div>

              {addresses.length > 1 && (
                <button
                  onClick={() => deleteAddress(addr.id)}
                  style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Brand Banner from Mood Board */}
      <div
        style={{
          background: 'linear-gradient(135deg, #111111 0%, #201D1A 100%)',
          borderRadius: 'var(--gt-radius-2xl)',
          padding: '24px 20px',
          color: '#FFFFFF',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gt-primary)', marginBottom: '8px' }}>
          <Sparkles size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            GharTak Community
          </span>
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
          Shop Local. Support Local. Grow Together.
        </h3>
        <p style={{ fontSize: '0.8125rem', color: '#AAA', lineHeight: 1.5 }}>
          Every order on GharTak directly empowers neighborhood merchants and delivery riders across Hailakandi, Assam.
        </p>
      </div>

      {/* Help Modal */}
      {showSupportModal && (
        <div className="gt-modal-overlay" onClick={() => setShowSupportModal(false)}>
          <div className="gt-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="gt-modal-header">
              <h3 className="gt-modal-title">GharTak Support & FAQs</h3>
              <button onClick={() => setShowSupportModal(false)} className="gt-icon-btn" style={{ width: '32px', height: '32px' }}>
                ✕
              </button>
            </div>
            <div className="gt-modal-body" style={{ fontSize: '0.875rem' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong>How fast is GharTak delivery?</strong>
                <p style={{ color: 'var(--gt-text-secondary)', marginTop: '4px' }}>
                  Orders are picked and delivered from nearby Hailakandi stores in 15–25 minutes.
                </p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Can I pay using Cash on Delivery?</strong>
                <p style={{ color: 'var(--gt-text-secondary)', marginTop: '4px' }}>
                  Yes, we accept UPI (Google Pay, PhonePe, Paytm), Debit/Credit cards, and Cash on Delivery at your doorstep.
                </p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Need immediate assistance with an order?</strong>
                <p style={{ color: 'var(--gt-text-secondary)', marginTop: '4px' }}>
                  Customer Helpline: <strong>+91 94350 00000</strong> (Hailakandi Support Center)
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSupportModal(false);
                  showToast('Help request logged. Our support will connect with you.', 'success');
                }}
                className="gt-btn gt-btn-primary gt-btn-full"
                style={{ marginTop: '10px' }}
              >
                Call Customer Care
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

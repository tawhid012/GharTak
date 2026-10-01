import React from 'react';
import { Truck, Store, ShieldCheck, CreditCard, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer = () => {
  const { navigate } = useApp();

  return (
    <footer
      style={{
        backgroundColor: '#111111',
        color: '#FFFFFF',
        padding: '50px 0 30px',
        marginTop: '60px',
        borderTop: '1px solid #222'
      }}
    >
      <div className="gt-container">
        {/* Value Prop Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            paddingBottom: '40px',
            borderBottom: '1px solid #262626',
            marginBottom: '40px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--gt-radius-full)',
                backgroundColor: 'rgba(255, 107, 53, 0.15)',
                color: 'var(--gt-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Truck size={20} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.9375rem', fontWeight: 600 }}>Fast Delivery</h4>
              <p style={{ color: '#888', fontSize: '0.8125rem' }}>Delivered in 15–25 minutes</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--gt-radius-full)',
                backgroundColor: 'rgba(255, 107, 53, 0.15)',
                color: 'var(--gt-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Store size={20} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.9375rem', fontWeight: 600 }}>Local Stores</h4>
              <p style={{ color: '#888', fontSize: '0.8125rem' }}>Supporting Hailakandi merchants</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--gt-radius-full)',
                backgroundColor: 'rgba(255, 107, 53, 0.15)',
                color: 'var(--gt-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.9375rem', fontWeight: 600 }}>Trusted Quality</h4>
              <p style={{ color: '#888', fontSize: '0.8125rem' }}>100% verified authentic goods</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--gt-radius-full)',
                backgroundColor: 'rgba(255, 107, 53, 0.15)',
                color: 'var(--gt-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.9375rem', fontWeight: 600 }}>Secure Payments</h4>
              <p style={{ color: '#888', fontSize: '0.8125rem' }}>UPI, Cards & Cash on Delivery</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px',
            marginBottom: '40px'
          }}
        >
          <div>
            <div style={{ marginBottom: '14px' }}>
              <img
                src="/brand/invers.png"
                alt="GHARTAK"
                style={{ height: '36px', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span
                style={{
                  display: 'none',
                  fontFamily: 'var(--gt-font-display)',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  letterSpacing: '-0.03em',
                  color: '#FFFFFF'
                }}
              >
                GHAR<span style={{ color: 'var(--gt-primary)' }}>TAK</span>
              </span>
            </div>
            <p style={{ color: '#999', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '14px' }}>
              Jo chahiye, GharTak. GHARTAK is your local marketplace, built to bring everything you need right to your doorstep in Hailakandi.
            </p>
            <span className="gt-badge" style={{ backgroundColor: '#262626', color: '#FF8F66' }}>
              📍 Hailakandi, Assam • 788151
            </span>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9375rem', fontWeight: 700, marginBottom: '16px' }}>
              Marketplace
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <button
                  onClick={() => navigate('explore', { categoryId: 'cat-groceries' })}
                  style={{ color: '#aaa', fontSize: '0.875rem' }}
                >
                  Groceries & Staples
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('explore', { categoryId: 'cat-dairy' })}
                  style={{ color: '#aaa', fontSize: '0.875rem' }}
                >
                  Dairy & Bakery
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('explore', { categoryId: 'cat-pharmacy' })}
                  style={{ color: '#aaa', fontSize: '0.875rem' }}
                >
                  Pharmacy & Wellness
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('explore', { categoryId: 'cat-assam' })}
                  style={{ color: '#aaa', fontSize: '0.875rem' }}
                >
                  Assam Tea & Specials
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9375rem', fontWeight: 700, marginBottom: '16px' }}>
              Quick Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <button onClick={() => navigate('home')} style={{ color: '#aaa', fontSize: '0.875rem' }}>
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigate('explore')} style={{ color: '#aaa', fontSize: '0.875rem' }}>
                  Explore All Categories
                </button>
              </li>
              <li>
                <button onClick={() => navigate('orders')} style={{ color: '#aaa', fontSize: '0.875rem' }}>
                  Track Active Orders
                </button>
              </li>
              <li>
                <button onClick={() => navigate('profile')} style={{ color: '#aaa', fontSize: '0.875rem' }}>
                  My Account & Addresses
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9375rem', fontWeight: 700, marginBottom: '16px' }}>
              Partner with GharTak
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <button
                  onClick={() => navigate('vendor-register')}
                  style={{ color: '#aaa', fontSize: '0.875rem', textAlign: 'left' }}
                >
                  Become a Vendor
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('rider-register')}
                  style={{ color: '#aaa', fontSize: '0.875rem', textAlign: 'left' }}
                >
                  Join as a Rider
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            paddingTop: '20px',
            borderTop: '1px solid #222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.8125rem',
            color: '#666'
          }}
        >
          <span>© 2026 GHARTAK Technologies Private Limited. All rights reserved.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Built with pride for <span style={{ color: '#fff', fontWeight: 600 }}>Hailakandi, Assam</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

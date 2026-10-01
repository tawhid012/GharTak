import React from 'react';
import { MapPin, ChevronDown, Bell, ShoppingBag, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header = () => {
  const {
    navigate,
    selectedLocation,
    setIsLocationModalOpen,
    cartItemCount,
    cartTotal,
    unreadNotificationCount,
    setIsNotificationOpen,
    user
  } = useApp();

  return (
    <header className="gt-header" role="banner">
      <div className="gt-container">
        <div className="gt-header-inner">
          {/* Logo & Location Selector with ample room to breathe */}
          <div className="gt-header-left">
            <button
              onClick={() => navigate('home')}
              className="gt-logo-link"
              aria-label="GharTak Home"
            >
              <img
                src="/brand/primary.png"
                alt="GHARTAK — Jo chahiye, GharTak."
                className="gt-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <span
                style={{
                  display: 'none',
                  fontFamily: 'var(--gt-font-display)',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  letterSpacing: '-0.03em',
                  color: 'var(--gt-dark)',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                GHAR<span style={{ color: 'var(--gt-primary)' }}>TAK</span>
              </span>
            </button>

            {/* Location Selector Pill */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="gt-location-btn"
              aria-label={`Current location: ${selectedLocation?.label || 'Hailakandi, Assam'}. Click to change.`}
            >
              <MapPin size={15} className="gt-location-icon" />
              <span>{selectedLocation?.label || 'Hailakandi, Assam'}</span>
              <ChevronDown size={14} className="gt-location-chevron" />
            </button>
          </div>

          {/* Right Actions:
              - Mobile: ONLY Notification Bell
              - Desktop: Notification Bell + Cart + Profile
          */}
          <div className="gt-header-right">
            {/* Notifications Button (Mobile & Desktop) */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="gt-icon-btn"
              aria-label={`Notifications ${unreadNotificationCount > 0 ? `(${unreadNotificationCount} unread)` : ''}`}
            >
              <Bell size={18} />
              {unreadNotificationCount > 0 && (
                <span className="gt-badge-count">{unreadNotificationCount}</span>
              )}
            </button>

            {/* Cart Button (Desktop Only) */}
            <button
              onClick={() => navigate('cart')}
              className="gt-header-cart-btn gt-header-desktop-only"
              aria-label={`Cart with ${cartItemCount} items, total ₹${cartTotal}`}
            >
              <ShoppingBag size={18} />
              <span>₹{cartTotal}</span>
              {cartItemCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--gt-primary)',
                    color: '#fff',
                    borderRadius: 'var(--gt-radius-full)',
                    fontSize: '0.75rem',
                    padding: '2px 7px',
                    marginLeft: '2px'
                  }}
                >
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Profile Avatar / Login Button (Desktop Only) */}
            <button
              onClick={() => {
                if (user) {
                  navigate('profile');
                } else {
                  navigate('login');
                }
              }}
              className="gt-icon-btn gt-header-desktop-only"
              aria-label={user ? `Profile: ${user.name}` : 'Log in to GharTak'}
              style={{ overflow: 'hidden' }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

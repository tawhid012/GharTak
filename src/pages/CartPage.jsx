import React, { useState } from 'react';
import { ArrowLeft, Trash2, Plus, Minus, Tag, ShieldCheck, MapPin, ArrowRight, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CartPage = () => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartItemCount,
    deliveryDistanceKm,
    baseDeliveryFee,
    cartPlatformFee,
    cartDiscount,
    cartTotal,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    selectedAddress,
    setIsLocationModalOpen,
    navigate,
    goBack
  } = useApp();


  const freeDeliveryThreshold = 299;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartSubtotal);

  if (cart.length === 0) {
    return (
      <div className="gt-container" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: 'var(--gt-radius-full)',
            backgroundColor: 'var(--gt-bg-card-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--gt-text-muted)'
          }}
        >
          <ShoppingBag size={40} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
          Your cart is empty
        </h2>
        <p style={{ color: 'var(--gt-text-muted)', fontSize: '0.9375rem', maxWidth: '360px', margin: '0 auto 24px' }}>
          Add fresh groceries, fruits, milk and daily essentials from stores near you in Hailakandi.
        </p>
        <button
          onClick={() => navigate('explore')}
          className="gt-btn gt-btn-primary"
        >
          <span>Start Shopping</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="gt-container" style={{ paddingTop: '16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={goBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--gt-text-secondary)'
          }}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
          <span>Continue Shopping</span>
        </button>

        <button
          onClick={clearCart}
          style={{ fontSize: '0.8125rem', color: '#EF4444', fontWeight: 600 }}
        >
          Clear Cart
        </button>
      </div>

      <h1 style={{ fontSize: '1.625rem', fontWeight: 800, marginBottom: '20px' }}>
        My Cart ({cartItemCount} items)
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'flex-start'
        }}
      >
        {/* Left Column: Delivery Address & Cart Items */}
        <div>
          {/* Address Header Bar */}
          <div
            onClick={() => setIsLocationModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              backgroundColor: 'var(--gt-bg-surface)',
              borderRadius: 'var(--gt-radius-xl)',
              border: '1px solid var(--gt-border-subtle)',
              marginBottom: '16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--gt-radius-full)',
                  backgroundColor: 'var(--gt-primary-surface)',
                  color: 'var(--gt-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                  Delivering to: {selectedAddress?.label || 'Home'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                  {selectedAddress?.locality || 'Hailakandi, Assam — 788151'}
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gt-primary)', fontWeight: 600 }}>
              Change
            </span>
          </div>

          {/* Free Delivery Meter */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: amountNeededForFreeDelivery === 0 ? 'var(--gt-success-light)' : 'var(--gt-bg-card-hover)',
              borderRadius: 'var(--gt-radius-lg)',
              border: `1px solid ${amountNeededForFreeDelivery === 0 ? 'var(--gt-success)' : 'var(--gt-border-subtle)'}`,
              marginBottom: '16px',
              fontSize: '0.8125rem'
            }}
          >
            {amountNeededForFreeDelivery === 0 ? (
              <span style={{ color: 'var(--gt-success)', fontWeight: 600 }}>
                🎉 You've unlocked FREE Delivery on this order!
              </span>
            ) : (
              <span style={{ color: 'var(--gt-text-secondary)' }}>
                Add items worth <strong>₹{amountNeededForFreeDelivery}</strong> more to get <strong>FREE delivery</strong>
              </span>
            )}
          </div>

          {/* Single Store Origin Guarantee */}
          {cart.length > 0 && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--gt-primary-surface)',
                borderRadius: 'var(--gt-radius-md)',
                border: '1px solid rgba(255, 107, 53, 0.25)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8125rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--gt-dark)' }}>
                  🏪 Fulfilling from {cart[0].storeName}
                </span>
                <span className="gt-badge gt-badge-green" style={{ fontSize: '0.6875rem' }}>
                  {deliveryDistanceKm} km
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-secondary)' }}>
                Single Store Guarantee
              </span>
            </div>
          )}

          {/* Cart Items List */}
          <div
            style={{
              backgroundColor: 'var(--gt-bg-surface)',
              borderRadius: 'var(--gt-radius-xl)',
              border: '1px solid var(--gt-border-subtle)',
              overflow: 'hidden',
              marginBottom: '20px'
            }}
          >
            {cart.map((item, index) => (
              <div
                key={item.itemKey}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 18px',
                  borderBottom: index < cart.length - 1 ? '1px solid var(--gt-border-subtle)' : 'none'
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--gt-radius-md)',
                    objectFit: 'cover',
                    backgroundColor: '#F8F6F2'
                  }}
                />

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--gt-text-primary)' }}>
                    {item.name}
                  </h4>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
                    {item.unit} • {item.storeName}
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--gt-text-primary)', marginTop: '4px' }}>
                    ₹{item.price}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="gt-qty-stepper">
                  <button
                    onClick={() => updateQuantity(item.itemKey, -1)}
                    className="gt-qty-btn"
                    aria-label="Decrease"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="gt-qty-num">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.itemKey, 1)}
                    className="gt-qty-btn"
                    aria-label="Increase"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Item Total */}
                <div style={{ minWidth: '50px', textAlign: 'right', fontWeight: 700, fontSize: '0.9375rem' }}>
                  ₹{item.price * item.quantity}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeFromCart(item.itemKey)}
                  style={{ color: 'var(--gt-text-muted)', padding: '4px' }}
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Bill Details */}
        <div>

          {/* Bill Summary */}
          <div
            style={{
              backgroundColor: 'var(--gt-bg-surface)',
              borderRadius: 'var(--gt-radius-xl)',
              padding: '20px',
              border: '1px solid var(--gt-border-subtle)',
              marginBottom: '20px'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
              Bill Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem', color: 'var(--gt-text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Item Subtotal</span>
                <span style={{ fontWeight: 600, color: 'var(--gt-text-primary)' }}>₹{cartSubtotal}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Partner Fee</span>
                <span style={{ fontWeight: 600, color: baseDeliveryFee === 0 ? 'var(--gt-success)' : 'var(--gt-text-primary)' }}>
                  {baseDeliveryFee === 0 ? 'FREE' : `₹${baseDeliveryFee}`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Platform Fee</span>
                <span style={{ fontWeight: 600, color: 'var(--gt-text-primary)' }}>₹{cartPlatformFee}</span>
              </div>

              {cartDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gt-success)' }}>
                  <span>Coupon Discount</span>
                  <span style={{ fontWeight: 700 }}>-₹{cartDiscount}</span>
                </div>
              )}

              <div
                style={{
                  height: '1px',
                  backgroundColor: 'var(--gt-border-subtle)',
                  margin: '8px 0'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, color: 'var(--gt-text-primary)' }}>
                <span>To Pay</span>
                <span>₹{cartTotal}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('checkout')}
              className="gt-btn gt-btn-primary gt-btn-full"
              style={{ marginTop: '20px' }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Trust Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--gt-text-muted)',
              fontSize: '0.8125rem'
            }}
          >
            <ShieldCheck size={16} color="var(--gt-success)" />
            <span>100% Safe & Contactless Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
};

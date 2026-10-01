import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Plus,
  ShieldCheck,
  Clock,
  Banknote,
  ArrowRight,
  Info,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CheckoutPage = () => {
  const {
    user,
    cart,
    cartSubtotal,
    deliveryDistanceKm,
    baseDeliveryFee,
    cartPlatformFee,
    cartDiscount,
    cartTotal,
    addresses,
    selectedAddress,
    setSelectedAddress,
    addAddress,
    placeOrder,
    navigate,
    goBack,
    selectedLocation,
    setIsLocationModalOpen
  } = useApp();

  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    recipient: user?.name || (user?.email ? user.email.split('@')[0] : ''),
    phone: user?.phone || '',
    line1: '',
    locality: 'Station Road',
    city: 'Hailakandi',
    state: 'Assam',
    pincode: '788151'
  });
  const [isPlacing, setIsPlacing] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="gt-container" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <h2>No items in checkout</h2>
        <button
          onClick={() => navigate('explore')}
          className="gt-btn gt-btn-primary"
          style={{ marginTop: '16px' }}
        >
          Browse Stores
        </button>
      </div>
    );
  }

  const primaryStore = cart[0];

  const handleCreateAddress = (e) => {
    e.preventDefault();
    if (newAddr.line1.trim()) {
      addAddress({
        ...newAddr,
        id: `addr-${Date.now()}`
      });
      setShowAddAddressForm(false);
      setNewAddr({ ...newAddr, line1: '' });
    }
  };

  const handlePlaceOrderClick = async () => {
    setIsPlacing(true);
    try {
      const order = await placeOrder();
      if (order) {
        navigate('order-confirmation', { orderId: order.id });
      }
    } catch (err) {
      console.error('Error placing order:', err);
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="gt-container" style={{ paddingTop: '16px', paddingBottom: '60px' }}>
      {/* Back button */}
      <button
        onClick={goBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '16px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--gt-text-secondary)'
        }}
        aria-label="Back to Cart"
      >
        <ArrowLeft size={18} />
        <span>Back to Cart</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800 }}>
          Checkout & Doorstep Delivery
        </h1>
        <span className="gt-badge gt-badge-orange">
          {primaryStore.storeName}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'flex-start'
        }}
      >
        {/* Left Column: GPS Location, Address & COD Info */}
        <div>
          {/* Step 1: GPS Serviceability & Delivery Address */}
          <div
            style={{
              backgroundColor: 'var(--gt-bg-surface)',
              borderRadius: 'var(--gt-radius-xl)',
              padding: '20px',
              border: '1px solid var(--gt-border-subtle)',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--gt-radius-full)',
                    backgroundColor: 'var(--gt-dark)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  1
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>GPS Location & Address</h3>
              </div>

              <button
                onClick={() => setIsLocationModalOpen(true)}
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--gt-primary)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Navigation size={14} />
                <span>Adjust GPS</span>
              </button>
            </div>

            {/* GPS Serviceability Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                backgroundColor: 'var(--gt-primary-surface)',
                borderRadius: 'var(--gt-radius-lg)',
                border: '1px solid rgba(255, 107, 53, 0.25)',
                marginBottom: '16px'
              }}
            >
              <CheckCircle2 size={18} style={{ color: 'var(--gt-primary)', flexShrink: 0 }} />
              <div style={{ fontSize: '0.8125rem' }}>
                <strong style={{ color: 'var(--gt-dark)' }}>Verified within 7 KM Service Radius: </strong>
                <span style={{ color: 'var(--gt-text-secondary)' }}>
                  Delivery distance: <strong>{deliveryDistanceKm} km</strong> from {primaryStore.storeName} to your coordinates.
                </span>
              </div>
            </div>

            {/* Saved Addresses Radio List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {addresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--gt-radius-lg)',
                      border: `1.5px solid ${isSelected ? 'var(--gt-primary)' : 'var(--gt-border-subtle)'}`,
                      backgroundColor: isSelected ? 'var(--gt-primary-surface)' : 'var(--gt-bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: 'var(--gt-radius-full)',
                        border: `2px solid ${isSelected ? 'var(--gt-primary)' : 'var(--gt-border-default)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2px',
                        flexShrink: 0
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: 'var(--gt-radius-full)',
                            backgroundColor: 'var(--gt-primary)'
                          }}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{addr.label}</span>
                        {addr.isDefault && (
                          <span className="gt-badge gt-badge-orange">Default</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)', marginTop: '2px' }}>
                        {addr.line1}, {addr.locality}, {addr.city} — {addr.pincode}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', marginTop: '2px' }}>
                        Recipient: {addr.recipient} • {addr.phone}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Address Collapsible */}
            {!showAddAddressForm ? (
              <button
                onClick={() => setShowAddAddressForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '12px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--gt-primary)'
                }}
              >
                <Plus size={14} />
                <span>Add a new Hailakandi delivery address</span>
              </button>
            ) : (
              <form
                onSubmit={handleCreateAddress}
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--gt-bg-card-hover)',
                  borderRadius: 'var(--gt-radius-lg)',
                  border: '1px solid var(--gt-border-subtle)'
                }}
              >
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '10px' }}>
                  Add Address in Hailakandi
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="House / Flat No., Landmark & Street"
                    value={newAddr.line1}
                    onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--gt-radius-md)',
                      border: '1px solid var(--gt-border-default)',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Locality (e.g. Station Road, Hospital Point, Lala Road)"
                    value={newAddr.locality}
                    onChange={(e) => setNewAddr({ ...newAddr, locality: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--gt-radius-md)',
                      border: '1px solid var(--gt-border-default)',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" className="gt-btn gt-btn-primary gt-btn-sm">
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddressForm(false)}
                      className="gt-btn gt-btn-ghost gt-btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Step 2: Strict Cash on Delivery Only */}
          <div
            style={{
              backgroundColor: 'var(--gt-bg-surface)',
              borderRadius: 'var(--gt-radius-xl)',
              padding: '20px',
              border: '1px solid var(--gt-border-subtle)',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--gt-radius-full)',
                  backgroundColor: 'var(--gt-dark)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                2
              </span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Payment Method</h3>
            </div>

            {/* Authoritative Cash on Delivery Display */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--gt-radius-lg)',
                border: '2px solid var(--gt-primary)',
                backgroundColor: 'var(--gt-primary-surface)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--gt-radius-full)',
                  backgroundColor: 'var(--gt-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Banknote size={22} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '1rem', color: 'var(--gt-dark)' }}>
                    Cash on Delivery (COD)
                  </strong>
                  <span className="gt-badge gt-badge-green" style={{ fontSize: '0.6875rem' }}>
                    Standard Mode
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gt-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                  Pay <strong>₹{cartTotal}</strong> in cash directly to your GharTak delivery rider upon receiving your order.
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', marginTop: '4px' }}>
                  💵 Exact cash collection will be verified directly by your rider at doorstep upon delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order CTA */}
        <div>
          <div
            style={{
              backgroundColor: 'var(--gt-bg-surface)',
              borderRadius: 'var(--gt-radius-xl)',
              padding: '20px',
              border: '1px solid var(--gt-border-subtle)',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--gt-radius-full)',
                  backgroundColor: 'var(--gt-dark)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                3
              </span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Authoritative Order Review</h3>
            </div>

            {/* Estimated delivery banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: 'var(--gt-primary-surface)',
                borderRadius: 'var(--gt-radius-md)',
                marginBottom: '16px',
                fontSize: '0.8125rem'
              }}
            >
              <Clock size={16} color="var(--gt-primary)" />
              <span style={{ color: 'var(--gt-primary)', fontWeight: 600 }}>
                Doorstep arrival in ~15–25 mins ({deliveryDistanceKm} km)
              </span>
            </div>

            {/* Items summary */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
              {cart.map((item) => (
                <div
                  key={item.itemKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--gt-border-subtle)',
                    fontSize: '0.8125rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--gt-text-secondary)' }}>
                      {item.quantity}x
                    </span>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Authoritative Price Breakdown */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.875rem',
                color: 'var(--gt-text-secondary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Item Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Delivery Fee ({deliveryDistanceKm} km)</span>
                <span>{baseDeliveryFee === 0 ? 'FREE' : `₹${baseDeliveryFee}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Platform Convenience Fee</span>
                <span>₹{cartPlatformFee}</span>
              </div>
              {cartDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gt-success)' }}>
                  <span>Coupon Discount</span>
                  <span>-₹{cartDiscount}</span>
                </div>
              )}
              <div style={{ height: '1px', backgroundColor: 'var(--gt-border-subtle)', margin: '4px 0' }} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: 'var(--gt-text-primary)'
                }}
              >
                <span>Final Payable (COD)</span>
                <span>₹{cartTotal}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handlePlaceOrderClick}
              disabled={isPlacing}
              className="gt-btn gt-btn-primary gt-btn-full"
              style={{ marginTop: '20px' }}
            >
              <span>
                {isPlacing ? 'Placing Order...' : `Place COD Order (Pay ₹${cartTotal})`}
              </span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              color: 'var(--gt-text-muted)'
            }}
          >
            <ShieldCheck size={16} color="var(--gt-success)" />
            <span>Strict Cash on Delivery • Verified OTP Handover</span>
          </div>
        </div>
      </div>
    </div>
  );
};

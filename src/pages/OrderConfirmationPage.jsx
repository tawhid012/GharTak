import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Package, Clock, MapPin, Store, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const OrderConfirmationPage = () => {
  const { currentRoute, navigate } = useApp();
  const orderId = currentRoute.params?.orderId;
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        const found = await api.getOrderById(orderId);
        setOrder(found);
      }
    };
    fetchOrder();
  }, [orderId]);

  return (
    <div className="gt-container" style={{ paddingTop: '32px', maxWidth: '600px' }}>
      <div
        style={{
          backgroundColor: 'var(--gt-bg-surface)',
          borderRadius: 'var(--gt-radius-2xl)',
          padding: '36px 28px',
          textAlign: 'center',
          border: '1px solid var(--gt-border-subtle)',
          boxShadow: 'var(--gt-shadow-md)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
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
          <CheckCircle2 size={40} />
        </div>

        <span className="gt-badge gt-badge-orange" style={{ marginBottom: '12px' }}>
          Cash on Delivery (Pending Collection)
        </span>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
          Order Placed — Cash on Delivery
        </h1>
        <p style={{ color: 'var(--gt-text-secondary)', fontSize: '0.9375rem', marginBottom: '24px' }}>
          Pay ₹{order?.total || 0} in cash upon doorstep arrival. Share your 4-digit Delivery OTP with your rider.
        </p>

        {/* Order ID Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--gt-primary-surface)',
            border: '1.5px solid var(--gt-primary)',
            padding: '8px 20px',
            borderRadius: 'var(--gt-radius-full)',
            marginBottom: '28px'
          }}
        >
          <span style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)' }}>Order ID:</span>
          <strong style={{ fontFamily: 'var(--gt-font-display)', color: 'var(--gt-primary)', fontSize: '1.0625rem' }}>
            #{order?.id || orderId}
          </strong>
        </div>

        {/* Summary Card */}
        <div
          style={{
            backgroundColor: 'var(--gt-bg-card-hover)',
            borderRadius: 'var(--gt-radius-xl)',
            padding: '18px 20px',
            textAlign: 'left',
            marginBottom: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '0.875rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--gt-text-muted)' }}>Estimated Delivery</span>
            <strong style={{ color: 'var(--gt-primary)' }}>15–25 mins</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--gt-text-muted)' }}>Store</span>
            <strong>{order?.storeName || 'Reliance Fresh'}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--gt-text-muted)' }}>Delivery Address</span>
            <span style={{ textAlign: 'right', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {order?.deliveryAddress?.line1 || 'Hailakandi, Assam'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--gt-text-muted)' }}>Payment Mode</span>
            <span style={{ fontWeight: 600, color: 'var(--gt-primary)' }}>
              Cash on Delivery (Pending)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--gt-text-muted)' }}>Total Amount to Pay</span>
            <strong style={{ fontSize: '1.0625rem', color: 'var(--gt-text-primary)' }}>
              ₹{order?.total || 0}
            </strong>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => navigate('order-tracking', { orderId: order?.id || orderId })}
            className="gt-btn gt-btn-primary gt-btn-full"
          >
            <span>Track Order Live</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => navigate('home')}
            className="gt-btn gt-btn-ghost gt-btn-full"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

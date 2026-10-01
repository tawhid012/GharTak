import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Store,
  Bike,
  ShieldCheck,
  MapPin,
  Banknote,
  KeyRound,
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { realtimeNotificationService } from '../services/realtimeNotificationService';

export const OrderTrackingPage = () => {
  const { currentRoute, goBack, navigate, orders, cancelOrder, showToast } = useApp();
  const orderId = currentRoute.params?.orderId;

  // Find order from global state
  const initialOrder = orders.find(o => o.id === orderId) || orders[0];
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    const matched = orders.find(o => o.id === orderId) || orders[0];
    setOrder(matched);
  }, [orders, orderId]);

  // Real-time subscription to this specific order's changes
  useEffect(() => {
    if (!order?.id) return;

    const unsubscribe = realtimeNotificationService.subscribeOrder(order.id, (updatedRow) => {
      setOrder(prev => ({
        ...prev,
        status: updatedRow.status,
        updatedAt: updatedRow.updated_at || Date.now()
      }));
      showToast(`Live update: Order #${order.id} is now ${updatedRow.status.replace(/_/g, ' ')}`, 'info');
    });

    return () => unsubscribe();
  }, [order?.id]);

  const stages = [
    { key: 'PENDING', label: 'Order Placed', desc: 'Received at GharTak Central Hub' },
    { key: 'CONFIRMED', label: 'Store Confirmed', desc: 'Store accepted your order' },
    { key: 'PREPARING', label: 'Preparing & Packing', desc: 'Items being fresh-packed' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Rider dispatched to store' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider on the way to doorstep' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'COD collected & handoff verified' }
  ];

  const currentStatus = order?.status || 'PENDING';
  const currentStageIndex = Math.max(0, stages.findIndex(s => s.key === currentStatus));

  const handleCallRider = () => {
    if (order?.rider?.phone) {
      window.location.href = `tel:${order.rider.phone}`;
    } else {
      showToast('Delivery rider will contact you directly upon arriving at your address', 'info');
    }
  };

  const handleMessageRider = () => {
    showToast('Delivery location and instructions confirmed for rider', 'success');
  };

  if (!order) {
    return (
      <div className="gt-container" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <h2>No order found to track</h2>
        <button onClick={() => navigate('orders')} className="gt-btn gt-btn-primary" style={{ marginTop: '16px' }}>
          View Order History
        </button>
      </div>
    );
  }

  return (
    <div className="gt-container" style={{ paddingTop: '16px', paddingBottom: '60px', maxWidth: '680px' }}>
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={() => navigate('orders')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--gt-text-secondary)'
          }}
          aria-label="Back to Orders"
        >
          <ArrowLeft size={18} />
          <span>My Orders</span>
        </button>

        <span className="gt-badge gt-badge-orange">
          {order.paymentStatus === 'COLLECTED' ? 'COD Collected' : 'Cash on Delivery'}
        </span>
      </div>

      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Order #{order.id}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
            From {order.storeName} • Hailakandi ({order.deliveryDistanceKm} km)
          </p>
        </div>

        <span
          className={`gt-badge ${currentStatus === 'DELIVERED' ? 'gt-badge-green' : 'gt-badge-orange'}`}
          style={{ padding: '6px 14px', fontSize: '0.8125rem', textTransform: 'capitalize' }}
        >
          {currentStatus.replace(/_/g, ' ')}
        </span>
      </div>

      {/* CASH ON DELIVERY CARD */}
      {currentStatus !== 'DELIVERED' && (
        <div
          style={{
            backgroundColor: '#1E1E1E',
            color: '#FFFFFF',
            borderRadius: 'var(--gt-radius-2xl)',
            padding: '20px 24px',
            marginBottom: '20px',
            border: '1px solid #333',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--gt-radius-full)',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                color: 'var(--gt-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Banknote size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Payment Method: Cash on Delivery
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#DDD', marginTop: '2px' }}>
                Please keep exact cash ready at your doorstep
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '8px 20px',
              backgroundColor: 'var(--gt-success)',
              borderRadius: 'var(--gt-radius-xl)',
              fontFamily: 'monospace',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)'
            }}
          >
            ₹{order.total}
          </div>
        </div>
      )}

      {/* ETA Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: 'var(--gt-bg-surface)',
          borderRadius: 'var(--gt-radius-xl)',
          border: '1px solid var(--gt-border-subtle)',
          boxShadow: 'var(--gt-shadow-xs)',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--gt-radius-full)',
              backgroundColor: 'var(--gt-primary-surface)',
              color: 'var(--gt-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>Estimated Delivery</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gt-text-primary)' }}>
              {order.eta || 'Arriving in ~15 mins'}
            </div>
          </div>
        </div>

        <span className="gt-badge gt-badge-green">
          Hailakandi Fleet Live
        </span>
      </div>

      {/* Rider Contact Card */}
      {order.rider && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: 'var(--gt-bg-surface)',
            borderRadius: 'var(--gt-radius-xl)',
            border: '1px solid var(--gt-border-subtle)',
            boxShadow: 'var(--gt-shadow-xs)',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={order.rider.photo}
              alt={order.rider.name}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--gt-radius-full)',
                objectFit: 'cover'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{order.rider.name}</span>
                <span className="gt-rating-pill" style={{ fontSize: '0.6875rem', padding: '1px 5px' }}>
                  ★ {order.rider.rating}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                {order.rider.vehicle}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCallRider}
              className="gt-icon-btn"
              style={{ backgroundColor: 'var(--gt-success-light)', color: 'var(--gt-success)', borderColor: 'var(--gt-success)' }}
              aria-label="Call Rider"
            >
              <Phone size={18} />
            </button>
            <button
              onClick={handleMessageRider}
              className="gt-icon-btn"
              aria-label="Send message to Rider"
            >
              <MessageSquare size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Visual Timeline of Order Stages */}
      <div
        style={{
          backgroundColor: 'var(--gt-bg-surface)',
          borderRadius: 'var(--gt-radius-xl)',
          padding: '24px 20px',
          border: '1px solid var(--gt-border-subtle)',
          marginBottom: '24px'
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>
          Delivery Status Timeline
        </h3>

        <div className="gt-tracking-timeline">
          {stages.map((stage, idx) => {
            const isCompleted = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={stage.key}
                className={`gt-timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <div className="gt-timeline-dot">
                  {isCompleted ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div className="gt-timeline-title">{stage.label}</div>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', marginTop: '2px' }}>
                  {stage.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Authoritative Order Breakdown */}
      <div
        style={{
          backgroundColor: 'var(--gt-bg-surface)',
          borderRadius: 'var(--gt-radius-xl)',
          padding: '20px',
          border: '1px solid var(--gt-border-subtle)',
          marginBottom: '24px'
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>
          Order Summary ({order.items?.length || 0} items)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {order.items?.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: idx < order.items.length - 1 ? '1px solid var(--gt-border-subtle)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: '40px', height: '40px', borderRadius: 'var(--gt-radius-sm)', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                    Qty: {item.quantity} • {item.unit}
                  </div>
                </div>
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                ₹{item.price * item.quantity}
              </span>
            </div>
          ))}

          {/* Pricing Ledger Snapshot */}
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--gt-border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', color: 'var(--gt-text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Item Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery Fee ({order.deliveryDistanceKm} km)</span>
              <span>₹{order.deliveryFee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Platform Fee</span>
              <span>₹{order.convenienceFee || 7}</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gt-success)' }}>
                <span>Discount</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
            <div
              style={{
                paddingTop: '8px',
                borderTop: '1px solid var(--gt-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 800,
                fontSize: '1.05rem',
                color: 'var(--gt-text-primary)'
              }}
            >
              <span>Cash on Delivery Amount</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>

        {(currentStatus === 'PENDING' || currentStatus === 'CONFIRMED') && (
          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to cancel this order?')) {
                await cancelOrder(order.id, 'Cancelled by customer');
              }
            }}
            className="gt-btn gt-btn-outline"
            style={{
              marginTop: '16px',
              width: '100%',
              color: 'var(--gt-danger, #e53e3e)',
              borderColor: 'var(--gt-danger, #e53e3e)'
            }}
          >
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
};

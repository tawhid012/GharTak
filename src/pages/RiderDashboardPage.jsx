import React, { useState, useEffect } from 'react';
import {
  Bike,
  Navigation,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  ArrowLeft,
  LogOut,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Banknote,
  Send
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { realtimeNotificationService } from '../services/realtimeNotificationService';

export const RiderDashboardPage = () => {
  const {
    user,
    logout,
    navigate,
    orders,
    vendorUpdateOrderStatus,
    riderAdvanceDeliveryStatus,
    riderClaimDeliveryJob,
    riderCompleteDelivery,
    riderVerifyOtpAndDeliver,
    showToast
  } = useApp();
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('deliveries'); // 'deliveries' | 'cash' | 'earnings'
  const [riderFinance, setRiderFinance] = useState(null);

  // COD collection form state (V1 - OTP disabled)
  const [collectedCash, setCollectedCash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const isRiderOrAdmin = user && (user.role === 'rider' || user.role === 'admin');
  const riderId = user?.id;
  const riderName = user?.name || (user?.email ? user.email.split('@')[0] : 'Delivery Rider');

  // Active delivery job (strictly assigned to this rider)
  const activeOrder = orders.find(
    o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (o.riderProfileId === riderId || o.rider?.id === riderId)
  );

  // Available jobs ready to claim
  const availableOrders = orders.filter(
    o => (o.status === 'READY_FOR_PICKUP' || o.deliveryStatus === 'READY_FOR_PICKUP') && !o.riderProfileId
  );

  const completedOrders = orders.filter(
    o => o.status === 'DELIVERED' && (o.riderProfileId === riderId || o.rider?.id === riderId)
  );

  // Load authoritative financial and cash ledger metrics
  useEffect(() => {
    if (!riderId) return;
    const fetchFinance = async () => {
      const summary = await api.getRiderFinance(riderId);
      setRiderFinance(summary);
    };
    fetchFinance();
  }, [orders, riderId]);

  // Realtime subscription for rider deliveries
  useEffect(() => {
    if (!riderId) return;
    const unsubscribe = realtimeNotificationService.subscribeRiderDeliveries(riderId, () => {
      api.getRiderFinance(riderId).then(setRiderFinance);
    });
    return () => unsubscribe();
  }, [riderId]);

  if (!isRiderOrAdmin) {
    return (
      <div className="gt-container" style={{ padding: '60px 16px', textAlign: 'center', maxWidth: '440px' }}>
        <Bike size={48} color="var(--gt-primary)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
          Rider Fleet Access Required
        </h2>
        <p style={{ color: 'var(--gt-text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
          Please sign in with your active delivery rider credentials to view, claim, and deliver orders.
        </p>
        <button onClick={() => navigate('login')} className="gt-btn gt-btn-primary gt-btn-full">
          Sign In as Rider
        </button>
      </div>
    );
  }

  // Handle workflow progression
  const handleAdvanceStatus = async (nextStatus) => {
    if (!activeOrder) return;
    if (nextStatus === 'PICKED_UP' || nextStatus === 'OUT_FOR_DELIVERY' || nextStatus === 'ARRIVED_CUSTOMER') {
      await riderAdvanceDeliveryStatus(activeOrder.id, nextStatus);
    } else {
      await vendorUpdateOrderStatus(activeOrder.id, nextStatus);
    }
  };

  // Handle COD collection and delivery completion (V1 - OTP disabled)
  const handleConfirmAndDeliver = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;

    if (!collectedCash || Number(collectedCash) !== Number(activeOrder.total)) {
      showToast(`Exact COD cash of ₹${activeOrder.total} must be collected`, 'warning');
      return;
    }

    setIsVerifying(true);
    try {
      await riderCompleteDelivery(activeOrder.id, Number(collectedCash));
      setCollectedCash('');
    } catch (err) {
      console.error('Handover error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="gt-container" style={{ paddingTop: '24px', paddingBottom: '60px', maxWidth: '860px' }}>
      {/* Top Banner with Consumer Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <button
          onClick={() => navigate('home')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--gt-text-secondary)'
          }}
        >
          <ArrowLeft size={16} />
          <span>Exit to Consumer Marketplace</span>
        </button>

        <button
          onClick={logout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#EF4444',
            padding: '6px 14px',
            borderRadius: 'var(--gt-radius-full)',
            border: '1px solid var(--gt-border-subtle)',
            backgroundColor: 'var(--gt-bg-surface)'
          }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Rider Header Card */}
      <div
        style={{
          backgroundColor: 'var(--gt-bg-surface)',
          borderRadius: 'var(--gt-radius-2xl)',
          padding: '24px 28px',
          border: '1px solid var(--gt-border-subtle)',
          boxShadow: 'var(--gt-shadow-sm)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: 'var(--gt-radius-xl)',
              backgroundColor: 'var(--gt-primary-surface)',
              color: 'var(--gt-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bike size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{riderName}</h1>
              <span className="gt-badge gt-badge-orange">Rider Partner</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', marginTop: '2px' }}>
              Hailakandi Local Fleet Partner • Active in 7 KM Service Zone
            </p>
          </div>
        </div>

        {/* Online / Offline Duty Toggle */}
        <div
          onClick={() => {
            setIsOnline(!isOnline);
            showToast(isOnline ? 'Rider went offline' : 'Rider is now online for Hailakandi jobs!', 'info');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            borderRadius: 'var(--gt-radius-full)',
            backgroundColor: isOnline ? 'var(--gt-success-light)' : 'var(--gt-bg-card-hover)',
            border: `1.5px solid ${isOnline ? 'var(--gt-success)' : 'var(--gt-border-default)'}`,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: isOnline ? 'var(--gt-success)' : 'var(--gt-text-muted)' }}>
            {isOnline ? 'Active On Duty' : 'Currently Offline'}
          </span>
          {isOnline ? <ToggleRight size={24} color="var(--gt-success)" /> : <ToggleLeft size={24} color="var(--gt-text-muted)" />}
        </div>
      </div>

      {/* Real Real-Time Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '18px 20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gt-text-muted)', textTransform: 'uppercase' }}>
            Completed Deliveries
          </div>
          <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.625rem', fontWeight: 800, marginTop: '4px' }}>
            {completedOrders.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gt-success)', fontWeight: 600 }}>
            {activeOrder ? '1 active job' : 'No active jobs'}
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '18px 20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gt-text-muted)', textTransform: 'uppercase' }}>
            Total Delivery Earnings
          </div>
          <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.625rem', fontWeight: 800, marginTop: '4px', color: 'var(--gt-primary)' }}>
            ₹{riderFinance?.totalEarned || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-secondary)' }}>
            ₹10 base + ₹3/delivery rule
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '18px 20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gt-text-muted)', textTransform: 'uppercase' }}>
            COD Cash Collected
          </div>
          <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.625rem', fontWeight: 800, marginTop: '4px', color: '#F59E0B' }}>
            ₹{riderFinance?.codCollected || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
            Remitted: ₹{riderFinance?.codRemitted || 0}
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '18px 20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gt-text-muted)', textTransform: 'uppercase' }}>
            Cash Outstanding to GharTak
          </div>
          <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.625rem', fontWeight: 800, marginTop: '4px', color: '#EF4444' }}>
            ₹{riderFinance?.cashOutstanding || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
            Held physically by rider
          </span>
        </div>
      </div>

      {/* Active Assignment Card with Required Flow */}
      {activeOrder ? (
        <div
          style={{
            backgroundColor: 'var(--gt-bg-surface)',
            borderRadius: 'var(--gt-radius-2xl)',
            padding: '24px',
            border: '2px solid var(--gt-primary)',
            boxShadow: 'var(--gt-shadow-md)',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span className="gt-badge gt-badge-orange" style={{ marginBottom: '6px' }}>
                Active Delivery Job
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Order #{activeOrder.id}</h2>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className="gt-badge gt-badge-green" style={{ fontSize: '0.8125rem' }}>
                COD to Collect: ₹{activeOrder.total}
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', marginTop: '2px' }}>
                Distance: {activeOrder.deliveryDistanceKm} km
              </div>
            </div>
          </div>

          {/* Route Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0 }}>
                A
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>STORE PICKUP</div>
                <strong style={{ fontSize: '0.9375rem' }}>{activeOrder.storeName}</strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)' }}>
                  {activeOrder.storeAddress || 'Station Road, Ward No. 3, Hailakandi'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gt-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0 }}>
                B
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>CUSTOMER DROP LOCATION</div>
                <strong style={{ fontSize: '0.9375rem' }}>{activeOrder.deliveryAddress?.recipient} ({activeOrder.deliveryAddress?.phone})</strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)' }}>
                  {activeOrder.deliveryAddress?.line1}, {activeOrder.deliveryAddress?.locality}
                </div>
              </div>
            </div>
          </div>

          {/* Current Lifecycle Status Pill */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--gt-bg-card-hover)',
              borderRadius: 'var(--gt-radius-lg)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem'
            }}
          >
            <span>Current Status:</span>
            <strong style={{ color: 'var(--gt-primary)', textTransform: 'uppercase' }}>
              {activeOrder.status.replace(/_/g, ' ')}
            </strong>
          </div>

          {/* Step-by-Step Rider Workflow Controls */}
          <div style={{ borderTop: '1px solid var(--gt-border-subtle)', paddingTop: '18px' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '12px' }}>
              Mandatory Handover Workflow
            </h4>

            {activeOrder.status === 'READY_FOR_PICKUP' && (
              <button
                onClick={() => handleAdvanceStatus('PICKED_UP')}
                className="gt-btn gt-btn-primary gt-btn-full"
              >
                Arrived at Store & Picked Up Items
              </button>
            )}

            {activeOrder.status === 'PICKED_UP' && (
              <button
                onClick={() => handleAdvanceStatus('OUT_FOR_DELIVERY')}
                className="gt-btn gt-btn-primary gt-btn-full"
              >
                Start Journey: Out for Delivery
              </button>
            )}

            {activeOrder.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => handleAdvanceStatus('ARRIVED_CUSTOMER')}
                className="gt-btn gt-btn-primary gt-btn-full"
                style={{ height: '48px', fontSize: '0.9375rem', fontWeight: 700 }}
              >
                Arrived at Customer Doorstep
              </button>
            )}

            {(activeOrder.status === 'ARRIVED_CUSTOMER' || activeOrder.status === 'OUT_FOR_DELIVERY') && (
              <form onSubmit={handleConfirmAndDeliver} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                <div
                  style={{
                    padding: '14px',
                    backgroundColor: 'var(--gt-primary-surface)',
                    borderRadius: 'var(--gt-radius-md)',
                    border: '1px solid var(--gt-primary)',
                    fontSize: '0.8125rem'
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--gt-dark)', marginBottom: '4px' }}>
                    Doorstep Cash on Delivery Handover
                  </div>
                  <div>1. Collect exact physical cash <strong>₹{activeOrder.total}</strong> from customer.</div>
                  <div>2. Hand over items and confirm collection below to complete delivery.</div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gt-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Cash Collected from Customer (₹)
                  </label>
                  <input
                    type="number"
                    placeholder={`Enter exact ₹${activeOrder.total}`}
                    value={collectedCash}
                    onChange={(e) => setCollectedCash(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--gt-radius-md)',
                      border: '1px solid var(--gt-border-default)',
                      fontSize: '1rem',
                      fontWeight: 700
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="gt-btn gt-btn-primary gt-btn-full"
                  style={{ height: '48px' }}
                >
                  {isVerifying ? 'Confirming & Recording...' : `Confirm ₹${activeOrder.total} Cash & Complete Delivery`}
                </button>
              </form>
            )}

            {activeOrder.status === 'PENDING' || activeOrder.status === 'CONFIRMED' || activeOrder.status === 'PREPARING' ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
                Store is currently packing items. You can proceed once status changes to <strong>READY_FOR_PICKUP</strong>.
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div>
          {availableOrders.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '12px' }}>
                Orders Ready for Delivery ({availableOrders.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {availableOrders.map(ord => (
                  <div
                    key={ord.id}
                    style={{
                      backgroundColor: 'var(--gt-bg-surface)',
                      padding: '16px 20px',
                      borderRadius: 'var(--gt-radius-xl)',
                      border: '1px solid var(--gt-border-subtle)',
                      boxShadow: 'var(--gt-shadow-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                        Order #{ord.id} • {ord.storeName || 'Merchant Store'}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', marginTop: '2px' }}>
                        Distance: {ord.deliveryDistanceKm || 1.0} km • Cash to Collect: <strong>₹{ord.total}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => riderClaimDeliveryJob(ord.id)}
                      className="gt-btn gt-btn-primary gt-btn-sm"
                    >
                      Accept Delivery
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              backgroundColor: 'var(--gt-bg-surface)',
              borderRadius: 'var(--gt-radius-2xl)',
              padding: '32px',
              textAlign: 'center',
              border: '1px solid var(--gt-border-subtle)',
              marginBottom: '24px'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--gt-radius-full)',
                backgroundColor: 'var(--gt-success-light)',
                color: 'var(--gt-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>No Active Delivery Jobs</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', marginTop: '4px' }}>
              You are active in Hailakandi. New orders will appear here automatically when ready.
            </p>
          </div>
        </div>
      )}

      {/* Completed Deliveries History */}
      <div
        style={{
          backgroundColor: 'var(--gt-bg-surface)',
          borderRadius: 'var(--gt-radius-2xl)',
          padding: '24px',
          border: '1px solid var(--gt-border-subtle)'
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>
          Completed Deliveries ({completedOrders.length})
        </h3>

        {completedOrders.length === 0 ? (
          <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
            No deliveries completed yet. Complete active trips above to build your earnings record.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {completedOrders.map((ord) => (
              <div
                key={ord.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--gt-radius-lg)',
                  backgroundColor: 'var(--gt-bg-card-hover)',
                  border: '1px solid var(--gt-border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>#{ord.id} • {ord.storeName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                    COD Collected: ₹{ord.total} • Distance: {ord.deliveryDistanceKm} km
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--gt-primary)' }}>
                    +₹13 Earning
                  </div>
                  <span className="gt-badge gt-badge-green" style={{ fontSize: '0.6875rem' }}>
                    Delivered
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

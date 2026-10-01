import React from 'react';
import {
  X,
  Bell,
  Package,
  Bike,
  CheckCircle2,
  Clock,
  IndianRupee,
  AlertTriangle,
  Volume2,
  VolumeX,
  CheckCheck,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationDrawer = () => {
  const {
    isNotificationOpen,
    setIsNotificationOpen,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotificationCount,
    isSoundMuted,
    toggleNotificationSound,
    navigate,
    user
  } = useApp();

  if (!isNotificationOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'ORDER_PLACED':
      case 'NEW_ORDER':
        return <Package size={18} color="var(--gt-primary)" />;
      case 'ORDER_CONFIRMED':
      case 'DELIVERY_COMPLETED':
        return <CheckCircle2 size={18} color="#10B981" />;
      case 'ORDER_PREPARING':
      case 'ORDER_READY':
      case 'ORDER_READY_FOR_PICKUP':
      case 'DELIVERY_READY':
        return <Clock size={18} color="#F59E0B" />;
      case 'RIDER_ASSIGNED':
      case 'DELIVERY_ASSIGNED':
      case 'ORDER_PICKED_UP':
      case 'ORDER_OUT_FOR_DELIVERY':
        return <Bike size={18} color="#3B82F6" />;
      case 'COD_COLLECTED':
      case 'COD_REMITTED':
      case 'SETTLEMENT_PAID':
      case 'SETTLEMENT_CREATED':
        return <IndianRupee size={18} color="#10B981" />;
      case 'ORDER_CANCELLED':
      case 'DELIVERY_CANCELLED':
      case 'DELIVERY_REASSIGNED':
      case 'SYSTEM_ALERT':
        return <AlertTriangle size={18} color="#EF4444" />;
      default:
        return <Bell size={18} color="var(--gt-primary)" />;
    }
  };

  const handleNotificationClick = (notif) => {
    markNotificationRead(notif.id);
    setIsNotificationOpen(false);

    if (notif.actionUrl) {
      if (notif.actionUrl.includes('order-tracking') && notif.orderId) {
        navigate('order-tracking', { orderId: notif.orderId });
      } else if (notif.actionUrl.includes('vendor-dashboard')) {
        navigate('vendor-dashboard');
      } else if (notif.actionUrl.includes('rider-dashboard')) {
        navigate('rider-dashboard');
      } else if (notif.actionUrl.includes('admin-dashboard')) {
        navigate('admin-dashboard');
      } else if (notif.actionUrl.includes('orders')) {
        navigate('orders');
      }
      return;
    }

    if (notif.orderId) {
      if (user?.role === 'vendor') {
        navigate('vendor-dashboard');
      } else if (user?.role === 'rider') {
        navigate('rider-dashboard');
      } else if (user?.role === 'admin') {
        navigate('admin-dashboard');
      } else {
        navigate('order-tracking', { orderId: notif.orderId });
      }
    }
  };

  return (
    <div className="gt-modal-overlay" onClick={() => setIsNotificationOpen(false)}>
      <div
        className="gt-modal-box"
        style={{ maxWidth: '460px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="gt-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--gt-border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Bell size={20} color="var(--gt-primary)" />
              {unreadNotificationCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--gt-primary)'
                  }}
                />
              )}
            </div>
            <h3 className="gt-modal-title" style={{ fontSize: '1.0625rem' }}>
              Notifications
            </h3>
            {unreadNotificationCount > 0 && (
              <span className="gt-badge gt-badge-orange" style={{ fontSize: '0.6875rem' }}>
                {unreadNotificationCount} new
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Sound Toggle */}
            <button
              onClick={toggleNotificationSound}
              className="gt-icon-btn"
              style={{ width: '32px', height: '32px' }}
              title={isSoundMuted ? 'Unmute sounds' : 'Mute sounds'}
              aria-label={isSoundMuted ? 'Unmute notifications' : 'Mute notifications'}
            >
              {isSoundMuted ? <VolumeX size={15} color="var(--gt-text-muted)" /> : <Volume2 size={15} color="var(--gt-primary)" />}
            </button>

            {/* Mark All As Read */}
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--gt-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: 'var(--gt-radius-md)'
                }}
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                <span>Mark read</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={() => setIsNotificationOpen(false)}
              className="gt-icon-btn"
              style={{ width: '32px', height: '32px' }}
              aria-label="Close notifications panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body / Notification List */}
        <div className="gt-modal-body gt-hide-scrollbar" style={{ padding: '12px 16px', overflowY: 'auto', flex: 1 }}>
          {notifications.length === 0 ? (
            /* Premium Empty State */
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--gt-text-muted)' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--gt-bg-card-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <ShieldCheck size={26} color="var(--gt-primary)" />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gt-text-primary)', marginBottom: '6px' }}>
                You're all caught up.
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)', maxWidth: '280px', margin: '0 auto' }}>
                Operational updates and order status changes will appear here in real time.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((notif) => {
                const isUnread = !notif.read && !notif.isRead;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: 'var(--gt-radius-lg)',
                      backgroundColor: isUnread ? 'rgba(255, 107, 53, 0.05)' : 'var(--gt-bg-surface)',
                      border: `1.5px solid ${isUnread ? 'rgba(255, 107, 53, 0.28)' : 'var(--gt-border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Unread Accent Dot */}
                    {isUnread && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--gt-primary)'
                        }}
                      />
                    )}

                    {/* Icon Wrap */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--gt-radius-full)',
                        backgroundColor: isUnread ? '#FFF4ED' : 'var(--gt-bg-card-hover)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {getIcon(notif.type)}
                    </div>

                    {/* Notification Details */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: isUnread ? '14px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span
                          style={{
                            fontWeight: isUnread ? 700 : 600,
                            fontSize: '0.875rem',
                            color: 'var(--gt-text-primary)'
                          }}
                        >
                          {notif.title}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--gt-text-muted)', flexShrink: 0 }}>
                          {notif.time || 'Just now'}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: '0.8125rem',
                          color: isUnread ? 'var(--gt-text-primary)' : 'var(--gt-text-secondary)',
                          marginTop: '3px',
                          lineHeight: 1.4
                        }}
                      >
                        {notif.message}
                      </p>

                      {/* Footer Link if Actionable */}
                      {(notif.orderId || notif.actionUrl) && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--gt-primary)'
                          }}
                        >
                          <span>View details</span>
                          <ChevronRight size={12} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--gt-border-subtle)',
            backgroundColor: 'var(--gt-bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--gt-text-muted)'
          }}
        >
          <span>GharTak Realtime Live Fleet</span>
          <span>Hailakandi Cluster 01</span>
        </div>
      </div>
    </div>
  );
};

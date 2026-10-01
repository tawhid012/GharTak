import React, { useState } from 'react';
import { Package, Clock, CheckCircle2, RefreshCw, ChevronRight, Store, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OrdersPage = () => {
  const { orders, navigate, reorder } = useApp();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'ongoing' | 'completed'

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ongoing') {
      return o.status !== 'DELIVERED';
    }
    if (activeTab === 'completed') {
      return o.status === 'DELIVERED';
    }
    return true;
  });

  return (
    <div className="gt-container" style={{ paddingTop: '20px', maxWidth: '720px' }}>
      <h1 style={{ fontSize: '1.625rem', fontWeight: 800, marginBottom: '6px' }}>
        My Orders
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--gt-text-muted)', marginBottom: '20px' }}>
        Past orders, live deliveries and instant reordering
      </p>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: 'var(--gt-bg-card-hover)',
          padding: '4px',
          borderRadius: 'var(--gt-radius-full)',
          width: 'fit-content',
          marginBottom: '24px',
          border: '1px solid var(--gt-border-subtle)'
        }}
      >
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '6px 18px',
            borderRadius: 'var(--gt-radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            backgroundColor: activeTab === 'all' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'all' ? 'var(--gt-dark)' : 'var(--gt-text-muted)',
            boxShadow: activeTab === 'all' ? 'var(--gt-shadow-xs)' : 'none'
          }}
        >
          All ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('ongoing')}
          style={{
            padding: '6px 18px',
            borderRadius: 'var(--gt-radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            backgroundColor: activeTab === 'ongoing' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'ongoing' ? 'var(--gt-dark)' : 'var(--gt-text-muted)',
            boxShadow: activeTab === 'ongoing' ? 'var(--gt-shadow-xs)' : 'none'
          }}
        >
          Ongoing ({orders.filter(o => o.status !== 'DELIVERED').length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          style={{
            padding: '6px 18px',
            borderRadius: 'var(--gt-radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            backgroundColor: activeTab === 'completed' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'completed' ? 'var(--gt-dark)' : 'var(--gt-text-muted)',
            boxShadow: activeTab === 'completed' ? 'var(--gt-shadow-xs)' : 'none'
          }}
        >
          Completed ({orders.filter(o => o.status === 'DELIVERED').length})
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--gt-bg-surface)',
            borderRadius: 'var(--gt-radius-2xl)',
            border: '1px solid var(--gt-border-subtle)'
          }}
        >
          <Package size={44} style={{ margin: '0 auto 12px', color: 'var(--gt-text-muted)', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '6px' }}>
            No {activeTab !== 'all' ? activeTab : ''} orders found
          </h3>
          <p style={{ color: 'var(--gt-text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
            Looks like you haven't placed an order in this section yet.
          </p>
          <button onClick={() => navigate('explore')} className="gt-btn gt-btn-primary gt-btn-sm">
            <span>Browse Products</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOrders.map((ord) => {
            const isOngoing = ord.status !== 'DELIVERED';
            return (
              <div
                key={ord.id}
                style={{
                  backgroundColor: 'var(--gt-bg-surface)',
                  borderRadius: 'var(--gt-radius-xl)',
                  padding: '18px 20px',
                  border: '1px solid var(--gt-border-subtle)',
                  boxShadow: 'var(--gt-shadow-xs)',
                  transition: 'all var(--gt-transition-base)'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--gt-radius-full)',
                        backgroundColor: isOngoing ? 'var(--gt-primary-surface)' : 'var(--gt-bg-card-hover)',
                        color: isOngoing ? 'var(--gt-primary)' : 'var(--gt-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Store size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{ord.storeName}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                        Order #{ord.id} • {ord.date}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`gt-badge ${ord.status === 'DELIVERED' ? 'gt-badge-green' : 'gt-badge-orange'}`}
                  >
                    {ord.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Items summary and thumbnails */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderTop: '1px solid var(--gt-border-subtle)',
                    borderBottom: '1px solid var(--gt-border-subtle)',
                    marginBottom: '14px',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
                    {ord.items?.slice(0, 3).map((item, i) => (
                      <img
                        key={i}
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--gt-radius-sm)',
                          objectFit: 'cover',
                          backgroundColor: '#F8F6F2'
                        }}
                      />
                    ))}
                    {ord.items?.length > 3 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', fontWeight: 600 }}>
                        +{ord.items.length - 3} more
                      </span>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>Total Amount</div>
                    <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.0625rem', fontWeight: 800 }}>
                      ₹{ord.total}
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <button
                    onClick={() => navigate('order-tracking', { orderId: ord.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: isOngoing ? 'var(--gt-primary)' : 'var(--gt-text-secondary)'
                    }}
                  >
                    <span>{isOngoing ? 'Track Live Delivery →' : 'View Tracking Details →'}</span>
                  </button>

                  <button
                    onClick={() => reorder(ord)}
                    className="gt-btn gt-btn-outline gt-btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={12} />
                    <span>Reorder</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

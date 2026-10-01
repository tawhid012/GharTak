import React, { useState, useEffect } from 'react';
import {
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  LogOut,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  PackageCheck,
  ChevronRight,
  IndianRupee,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { realtimeNotificationService } from '../services/realtimeNotificationService';

export const VendorDashboardPage = () => {
  const { user, logout, navigate, orders, vendorUpdateOrderStatus, showToast } = useApp();
  const [storeOpen, setStoreOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory' | 'settlements'
  const [financeSummary, setFinanceSummary] = useState(null);
  const [vendorStore, setVendorStore] = useState(null);

  const isVendorOrAdmin = user && (user.role === 'vendor' || user.role === 'admin');

  // Load vendor store from database
  useEffect(() => {
    if (!user) return;
    const fetchStore = async () => {
      try {
        const stores = await api.getStores();
        const myStore = stores.find(s => s.vendor_profile_id === user.id || s.id === user.storeId) || stores[0];
        setVendorStore(myStore);
      } catch (err) {
        console.warn('Error loading vendor store:', err);
      }
    };
    fetchStore();
  }, [user]);

  const vendorName = vendorStore?.name || user?.storeName || 'Merchant Store';
  const vendorStoreId = vendorStore?.id || user?.storeId;

  // Filter orders belonging to this store
  const storeOrders = orders.filter(
    o => (vendorStoreId && o.storeId === vendorStoreId) || (user?.id && o.vendorProfileId === user.id)
  );

  const pendingOrders = storeOrders.filter(o => o.status === 'PENDING');
  const preparingOrders = storeOrders.filter(o => o.status === 'CONFIRMED' || o.status === 'PREPARING');
  const readyOrders = storeOrders.filter(o => o.status === 'READY_FOR_PICKUP');
  const deliveredOrders = storeOrders.filter(o => o.status === 'DELIVERED');

  // Load authoritative financial settlement summary
  useEffect(() => {
    if (!user?.id || !vendorStoreId) return;
    const fetchFinance = async () => {
      const summary = await api.getVendorFinance(user.id, vendorStoreId);
      setFinanceSummary(summary);
    };
    fetchFinance();
  }, [orders, user?.id, vendorStoreId]);

  // Realtime subscription for Store Orders & Finance updates
  useEffect(() => {
    if (!vendorStoreId || !user?.id) return;
    const unsubscribe = realtimeNotificationService.subscribeStoreOrders(vendorStoreId, () => {
      api.getVendorFinance(user.id, vendorStoreId).then(setFinanceSummary);
    });
    return () => unsubscribe();
  }, [vendorStoreId, user?.id]);

  if (!isVendorOrAdmin) {
    return (
      <div className="gt-container" style={{ padding: '60px 16px', textAlign: 'center', maxWidth: '440px' }}>
        <Store size={48} color="var(--gt-primary)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
          Vendor Portal Login Required
        </h2>
        <p style={{ color: 'var(--gt-text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
          Please sign in with your verified merchant account to manage your store, inventory, and orders.
        </p>
        <button onClick={() => navigate('login')} className="gt-btn gt-btn-primary gt-btn-full">
          Sign In as Vendor
        </button>
      </div>
    );
  }

  return (
    <div className="gt-container" style={{ paddingTop: '24px', paddingBottom: '60px', maxWidth: '920px' }}>
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

      {/* Store Header Card */}
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
            <Store size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{vendorName}</h1>
              <span className="gt-badge gt-badge-orange">Merchant Partner</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', marginTop: '2px' }}>
              Station Road, Ward No. 3, Hailakandi, Assam • GPS: 24.6841°N, 92.5638°E
            </p>
          </div>
        </div>

        {/* Operating status toggle */}
        <div
          onClick={() => {
            setStoreOpen(!storeOpen);
            showToast(storeOpen ? 'Store temporarily paused' : 'Store is now accepting orders!', 'info');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            borderRadius: 'var(--gt-radius-full)',
            backgroundColor: storeOpen ? 'var(--gt-success-light)' : 'var(--gt-bg-card-hover)',
            border: `1.5px solid ${storeOpen ? 'var(--gt-success)' : 'var(--gt-border-default)'}`,
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: storeOpen ? 'var(--gt-success)' : 'var(--gt-text-muted)' }}>
            {storeOpen ? 'Store Open & Accepting' : 'Store Paused'}
          </span>
          {storeOpen ? <ToggleRight size={24} color="var(--gt-success)" /> : <ToggleLeft size={24} color="var(--gt-text-muted)" />}
        </div>
      </div>

      {/* Real Real-Time Statistics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '18px 20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gt-text-muted)', textTransform: 'uppercase' }}>
            Store Orders (Total)
          </div>
          <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.625rem', fontWeight: 800, marginTop: '4px' }}>
            {storeOrders.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gt-primary)', fontWeight: 600 }}>
            {pendingOrders.length} pending action
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '18px 20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gt-text-muted)', textTransform: 'uppercase' }}>
            Gross Delivered Sales
          </div>
          <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.625rem', fontWeight: 800, marginTop: '4px' }}>
            ₹{financeSummary?.grossSales || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gt-success)', fontWeight: 600 }}>
            {deliveredOrders.length} fulfilled
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '18px 20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gt-text-muted)', textTransform: 'uppercase' }}>
            Net Payable from GharTak
          </div>
          <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.625rem', fontWeight: 800, marginTop: '4px' }}>
            ₹{financeSummary?.netPayable || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-secondary)' }}>
            {financeSummary?.effectiveCommissionPercent > 0
              ? `After ${financeSummary.effectiveCommissionPercent}% platform deduction`
              : 'Zero platform commission'}
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '18px 20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gt-text-muted)', textTransform: 'uppercase' }}>
            Outstanding Balance
          </div>
          <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.625rem', fontWeight: 800, marginTop: '4px', color: 'var(--gt-primary)' }}>
            ₹{financeSummary?.remainingBalance || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
            Paid: ₹{financeSummary?.totalPaid || 0}
          </span>
        </div>
      </div>

      {/* Tabs: Orders vs Settlements */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: 'var(--gt-bg-card-hover)',
          padding: '4px',
          borderRadius: 'var(--gt-radius-full)',
          width: 'fit-content',
          marginBottom: '20px',
          border: '1px solid var(--gt-border-subtle)'
        }}
      >
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '6px 18px',
            borderRadius: 'var(--gt-radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            backgroundColor: activeTab === 'orders' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'orders' ? 'var(--gt-dark)' : 'var(--gt-text-muted)'
          }}
        >
          Live Orders ({storeOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('settlements')}
          style={{
            padding: '6px 18px',
            borderRadius: 'var(--gt-radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            backgroundColor: activeTab === 'settlements' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'settlements' ? 'var(--gt-dark)' : 'var(--gt-text-muted)'
          }}
        >
          Settlements & Payout Ledger
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div
          style={{
            backgroundColor: 'var(--gt-bg-surface)',
            borderRadius: 'var(--gt-radius-2xl)',
            padding: '24px',
            border: '1px solid var(--gt-border-subtle)',
            boxShadow: 'var(--gt-shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Orders Fulfillment Queue</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
                Process incoming orders: Accept, prepare, and notify riders for pickup
              </p>
            </div>
            <span className="gt-badge gt-badge-green">Authoritative DB</span>
          </div>

          {storeOrders.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gt-text-muted)' }}>
              No orders received yet for this store.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {storeOrders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 'var(--gt-radius-xl)',
                    backgroundColor: 'var(--gt-bg-card-hover)',
                    border: '1px solid var(--gt-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.05rem' }}>
                        #{ord.id}
                      </strong>
                      <span className={`gt-badge ${ord.status === 'DELIVERED' ? 'gt-badge-green' : 'gt-badge-orange'}`}>
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                      <span className="gt-badge gt-badge-green">
                        COD: ₹{ord.total}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
                      Distance: <strong>{ord.deliveryDistanceKm} km</strong>
                    </div>
                  </div>

                  {/* Items List */}
                  <div style={{ fontSize: '0.875rem', color: 'var(--gt-text-secondary)', backgroundColor: 'var(--gt-bg-surface)', padding: '10px 14px', borderRadius: 'var(--gt-radius-md)' }}>
                    {ord.items?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span>{it.quantity}x {it.name} ({it.unit})</span>
                        <span style={{ fontWeight: 600 }}>₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--gt-border-subtle)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>Subtotal</span>
                      <span>₹{ord.subtotal}</span>
                    </div>
                  </div>

                  {/* Delivery Location snapshot */}
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
                    📍 Delivery to: {ord.deliveryAddress?.recipient} • {ord.deliveryAddress?.line1}, {ord.deliveryAddress?.locality}
                  </div>

                  {/* Interactive Status Progression Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {ord.status === 'PENDING' && (
                      <button
                        onClick={() => vendorUpdateOrderStatus(ord.id, 'CONFIRMED')}
                        className="gt-btn gt-btn-primary gt-btn-sm"
                      >
                        Accept Order
                      </button>
                    )}

                    {ord.status === 'CONFIRMED' && (
                      <button
                        onClick={() => vendorUpdateOrderStatus(ord.id, 'PREPARING')}
                        className="gt-btn gt-btn-primary gt-btn-sm"
                      >
                        Start Preparing Items
                      </button>
                    )}

                    {ord.status === 'PREPARING' && (
                      <button
                        onClick={() => vendorUpdateOrderStatus(ord.id, 'READY_FOR_PICKUP')}
                        className="gt-btn gt-btn-primary gt-btn-sm"
                      >
                        Mark Ready for Rider Pickup
                      </button>
                    )}

                    {ord.status === 'READY_FOR_PICKUP' && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--gt-primary)', fontWeight: 600 }}>
                        ⏳ Packed and awaiting rider arrival at store
                      </span>
                    )}

                    {ord.status === 'OUT_FOR_DELIVERY' && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)', fontWeight: 600 }}>
                        🛵 Rider is on the way to customer doorstep
                      </span>
                    )}

                    {ord.status === 'DELIVERED' && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--gt-success)', fontWeight: 600 }}>
                        ✓ Order fulfilled & COD cash collected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETTLEMENTS TAB */}
      {activeTab === 'settlements' && (
        <div
          style={{
            backgroundColor: 'var(--gt-bg-surface)',
            borderRadius: 'var(--gt-radius-2xl)',
            padding: '24px',
            border: '1px solid var(--gt-border-subtle)',
            boxShadow: 'var(--gt-shadow-xs)'
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '4px' }}>
            Merchant Settlement & Payouts
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', marginBottom: '20px' }}>
            Immutable financial records. GharTak Admin manages final bank/UPI remittances.
          </p>

          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--gt-bg-card-hover)',
              borderRadius: 'var(--gt-radius-xl)',
              border: '1px solid var(--gt-border-subtle)',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>Gross Store Sales</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹{financeSummary?.grossSales || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                  Platform Commission ({financeSummary?.effectiveCommissionPercent ?? 0}%)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>-₹{financeSummary?.platformDeductions || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>Total Remitted to Store</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gt-success)' }}>₹{financeSummary?.totalPaid || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>Outstanding Payable</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gt-primary)' }}>₹{financeSummary?.remainingBalance || 0}</div>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '12px' }}>
            Remittance Transaction History
          </h3>

          {financeSummary?.recentTransactions?.length === 0 ? (
            <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', padding: '20px 0' }}>
              No settlement disbursements recorded yet. Admin processes weekly payouts.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {financeSummary?.recentTransactions?.map(tx => (
                <div
                  key={tx.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--gt-radius-lg)',
                    border: '1px solid var(--gt-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{tx.paymentReference}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                      Method: {tx.paymentMethod} • Settled by {tx.settledBy}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--gt-success)' }}>
                      +₹{tx.amountPaid}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

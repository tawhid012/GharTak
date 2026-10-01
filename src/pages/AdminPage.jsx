import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Store,
  Bike,
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Settings,
  Receipt,
  Banknote,
  Search,
  Filter,
  DollarSign,
  Plus,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api, AUTHORITATIVE_STORES } from '../services/api';
import { realtimeNotificationService } from '../services/realtimeNotificationService';

export const AdminPage = () => {
  const { user, loginAdmin, logout, navigate, orders, showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tabs: 'overview' | 'orders' | 'finance' | 'partners' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const [financeSubTab, setFinanceSubTab] = useState('vendors'); // 'vendors' | 'riders' | 'cod' | 'history'

  const [vendorApps, setVendorApps] = useState([]);
  const [riderApps, setRiderApps] = useState([]);
  const [vendorFinance, setVendorFinance] = useState(null);
  const [riderFinance, setRiderFinance] = useState(null);
  const [settlementHistory, setSettlementHistory] = useState([]);

  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutTarget, setPayoutTarget] = useState(null); // { type, id, name, maxAmount }
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('UPI');
  const [payoutRef, setPayoutRef] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  // Remittance Modal State (Rider depositing COD cash to Admin)
  const [isRemitModalOpen, setIsRemitModalOpen] = useState(false);
  const [remitAmount, setRemitAmount] = useState('');
  const [remitRef, setRemitRef] = useState('');

  // Admin Operational Settings State
  const [opSettings, setOpSettings] = useState(api.getOperationalSettings());

  const isAdmin = user?.role === 'admin';

  // Load backend data
  const loadData = async () => {
    try {
      const [vApps, rApps, txHistory] = await Promise.all([
        api.getVendorApplications(),
        api.getRiderApplications(),
        api.getSettlementTransactions()
      ]);
      setVendorApps(vApps);
      setRiderApps(rApps);
      setSettlementHistory(txHistory);

      if (vApps.length > 0) {
        const firstVendor = vApps[0];
        const vFin = await api.getVendorFinance(firstVendor.vendorProfileId || firstVendor.id, firstVendor.id);
        setVendorFinance(vFin);
      } else {
        setVendorFinance(null);
      }

      if (rApps.length > 0) {
        const firstRider = rApps[0];
        const rFin = await api.getRiderFinance(firstRider.id);
        setRiderFinance(rFin);
      } else {
        setRiderFinance(null);
      }

      setOpSettings(api.getOperationalSettings());
    } catch (err) {
      console.warn('Error loading admin operational data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [orders, isAdmin]);

  // Realtime subscription for Admin live operational command center
  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = realtimeNotificationService.subscribeAdminOperations(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await loginAdmin(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveVendor = (appId) => {
    setVendorApps(prev => prev.map(a => a.id === appId ? { ...a, status: 'APPROVED' } : a));
    showToast('Merchant store approved and activated!', 'success');
  };

  const handleApproveRider = (appId) => {
    setRiderApps(prev => prev.map(a => a.id === appId ? { ...a, status: 'APPROVED' } : a));
    showToast('Rider onboarded to Hailakandi fleet!', 'success');
  };

  // Open "Mark as Paid" Modal
  const openPayoutModal = (type, id, name, remainingBalance) => {
    if (remainingBalance <= 0) {
      showToast('No outstanding balance remaining to settle', 'info');
      return;
    }
    setPayoutTarget({ type, id, name, maxAmount: remainingBalance });
    setPayoutAmount(String(remainingBalance));
    setPayoutRef(`REF-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`);
    setPayoutNotes(type === 'VENDOR' ? 'Store weekly disbursement' : 'Rider trip settlement');
    setIsPayoutModalOpen(true);
  };

  // Submit Settlement Payment
  const handleSubmitPayout = async (e) => {
    e.preventDefault();
    const amt = Number(payoutAmount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }

    if (amt > payoutTarget.maxAmount) {
      showToast(`Overpayment blocked! Maximum payable is ₹${payoutTarget.maxAmount}`, 'warning');
      return;
    }

    try {
      await api.recordSettlementPayment({
        recipientType: payoutTarget.type,
        recipientId: payoutTarget.id,
        recipientName: payoutTarget.name,
        amountPaidPaise: Math.round(amt * 100),
        paymentMethod: payoutMethod,
        paymentReference: payoutRef,
        notes: payoutNotes,
        adminUser: user
      });

      setIsPayoutModalOpen(false);
      showToast(`Payment of ₹${amt} recorded successfully!`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to record payout', 'warning');
    }
  };

  // Submit Rider Cash Deposit
  const handleSubmitRemit = async (e) => {
    e.preventDefault();
    const amt = Number(remitAmount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid deposit amount', 'warning');
      return;
    }

    const outstanding = riderFinance?.cashOutstanding || 0;
    if (amt > outstanding) {
      showToast(`Deposit exceeds cash held (₹${outstanding})`, 'warning');
      return;
    }

    try {
      await api.recordRiderCashRemittance({
        riderId: 'a0000000-0000-0000-0000-000000000004',
        riderName: 'Rahul Das',
        amountRemittedPaise: Math.round(amt * 100),
        paymentMethod: 'CASH',
        reference: remitRef || `CASH-DEP-${Date.now()}`,
        notes: 'Rider deposited COD cash at Central Hailakandi Hub',
        adminUser: user
      });

      setIsRemitModalOpen(false);
      setRemitAmount('');
      showToast(`Recorded ₹${amt} cash deposit from rider!`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to record remittance', 'warning');
    }
  };

  // Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    api.updateOperationalSettings(opSettings);
    showToast('Operational settings saved & active for new orders!', 'success');
  };

  // Non-authenticated Admin Login Gate
  if (!isAdmin) {
    return (
      <div
        className="gt-container"
        style={{
          paddingTop: '40px',
          paddingBottom: '60px',
          maxWidth: '420px',
          minHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <button
          onClick={() => navigate('home')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--gt-text-secondary)',
            width: 'fit-content'
          }}
        >
          <ArrowLeft size={16} />
          <span>Exit to Marketplace</span>
        </button>

        <div
          style={{
            backgroundColor: '#161616',
            color: '#FFFFFF',
            borderRadius: 'var(--gt-radius-2xl)',
            padding: '36px 30px',
            border: '1px solid #282828',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--gt-radius-xl)',
                backgroundColor: 'rgba(255, 107, 53, 0.15)',
                color: 'var(--gt-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Shield size={28} />
            </div>

            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
              GHARTAK OPS ADMIN
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#888' }}>
              Hailakandi Central Operations, Financial Ledger & Fleet Hub
            </p>
          </div>

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#AAA', marginBottom: '6px' }}>
                ADMIN WORKSPACE EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#222',
                  border: '1px solid #333',
                  borderRadius: 'var(--gt-radius-lg)',
                  color: '#FFF',
                  fontSize: '0.9375rem'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#AAA', marginBottom: '6px' }}>
                SECURITY ACCESS KEY
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: '#222',
                  border: '1px solid #333',
                  borderRadius: 'var(--gt-radius-lg)',
                  color: '#FFF',
                  fontSize: '0.9375rem'
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="gt-btn gt-btn-primary gt-btn-full"
              style={{ marginTop: '8px', padding: '14px' }}
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Enter Operations Portal'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authoritative Metrics Calculations from Database
  const totalOrdersCount = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  const totalGMV = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalPlatformRevenue = orders.reduce((sum, o) => sum + (o.convenienceFee || 7), 0) +
    deliveredOrders.reduce((sum, o) => {
      const commPct = o.pricingSnapshot?.vendorCommissionPercent !== undefined
        ? o.pricingSnapshot.vendorCommissionPercent
        : (opSettings?.vendorCommissionPercent ?? 0.0);
      return sum + Math.round((o.subtotal || 0) * (commPct / 100));
    }, 0);
  const activeStoresCount = 1;
  const activeRidersCount = riderApps.filter(r => r.status === 'APPROVED').length || (riderFinance ? 1 : 0);

  return (
    <div className="gt-container" style={{ paddingTop: '24px', paddingBottom: '60px', maxWidth: '1040px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
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
          <span>Exit to Marketplace</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
            Admin Session: <strong>{user?.name}</strong>
          </span>
          <button
            onClick={logout}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--gt-radius-full)',
              border: '1px solid var(--gt-border-subtle)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#EF4444'
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Admin Card */}
      <div
        style={{
          backgroundColor: '#111111',
          color: '#FFFFFF',
          borderRadius: 'var(--gt-radius-2xl)',
          padding: '24px 28px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              GHARTAK Central Operations & Settlements Hub
            </h1>
            <span className="gt-badge gt-badge-orange">Cluster 01 • Hailakandi</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#999', marginTop: '4px' }}>
            Strict 7 KM Delivery Policy • Cash on Delivery Verification • Auditable Financial Ledger
          </p>
        </div>

        <span className="gt-badge gt-badge-green" style={{ padding: '6px 14px' }}>
          Production Backend Connected
        </span>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: 'var(--gt-bg-card-hover)',
          padding: '4px',
          borderRadius: 'var(--gt-radius-full)',
          width: 'fit-content',
          marginBottom: '24px',
          border: '1px solid var(--gt-border-subtle)',
          flexWrap: 'wrap'
        }}
      >
        {[
          { key: 'overview', label: 'Operational Overview' },
          { key: 'orders', label: `Orders Queue (${orders.length})` },
          { key: 'finance', label: 'Finance & Settlements' },
          { key: 'partners', label: 'Partner Onboarding' },
          { key: 'settings', label: 'Delivery & Pricing Rules' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--gt-radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: activeTab === t.key ? '#FFFFFF' : 'transparent',
              color: activeTab === t.key ? 'var(--gt-dark)' : 'var(--gt-text-muted)'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div>
          {/* Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Marketplace GMV</div>
              <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.75rem', fontWeight: 800, marginTop: '4px' }}>₹{totalGMV}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-secondary)' }}>From {totalOrdersCount} real customer orders</span>
            </div>

            <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Platform Gross Margin</div>
              <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: 'var(--gt-success)' }}>₹{totalPlatformRevenue}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                ₹7 fee {opSettings?.vendorCommissionPercent > 0 ? `+ ${opSettings.vendorCommissionPercent}% vendor commission` : '(0% vendor commission)'}
              </span>
            </div>

            <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>COD Cash Outstanding</div>
              <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: '#EF4444' }}>₹{riderFinance?.cashOutstanding || 0}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>Physically held by delivery fleet</span>
            </div>

            <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '20px', borderRadius: 'var(--gt-radius-xl)', border: '1px solid var(--gt-border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Fleet & Stores</div>
              <div style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.75rem', fontWeight: 800, marginTop: '4px' }}>
                {activeStoresCount} Store{activeStoresCount === 1 ? '' : 's'} / {activeRidersCount} Rider{activeRidersCount === 1 ? '' : 's'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--gt-primary)', fontWeight: 600 }}>Hailakandi Station Rd Cluster</span>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS QUEUE TAB */}
      {activeTab === 'orders' && (
        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '24px', borderRadius: 'var(--gt-radius-2xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>
            Authoritative Order Audit Trail ({orders.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map(ord => (
              <div
                key={ord.id}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--gt-radius-lg)',
                  backgroundColor: 'var(--gt-bg-card-hover)',
                  border: '1px solid var(--gt-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>#{ord.id}</strong>
                    <span className={`gt-badge ${ord.status === 'DELIVERED' ? 'gt-badge-green' : 'gt-badge-orange'}`}>
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                    <span className="gt-badge gt-badge-green">COD: {ord.paymentStatus}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)', marginTop: '4px' }}>
                    Store: {ord.storeName} • Customer: {ord.deliveryAddress?.recipient} • Distance: {ord.deliveryDistanceKm} km
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', marginTop: '2px' }}>
                    OTP Status: <strong>{ord.deliveryOtpVerifiedAt ? 'Verified ✓' : (ord.status === 'DELIVERED' ? 'Verified' : 'Active (Hashed)')}</strong> • Fee: ₹{ord.deliveryFee} • Platform: ₹{ord.convenienceFee || 7}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--gt-font-display)', fontWeight: 800, fontSize: '1.125rem' }}>
                    ₹{ord.total}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                    Rider: {ord.rider?.name || 'Rahul Das'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FINANCE & SETTLEMENTS TAB */}
      {activeTab === 'finance' && (
        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '24px', borderRadius: 'var(--gt-radius-2xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Financial Operations & Settlements</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
                Deterministic payouts, partial disbursements, and physical COD remittance tracking
              </p>
            </div>

            {/* Sub-Tabs */}
            <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--gt-bg-card-hover)', padding: '4px', borderRadius: 'var(--gt-radius-full)' }}>
              {[
                { key: 'vendors', label: 'Vendor Payouts' },
                { key: 'riders', label: 'Rider Payouts' },
                { key: 'cod', label: 'COD Cash Reconciliation' },
                { key: 'history', label: 'Ledger History' }
              ].map(st => (
                <button
                  key={st.key}
                  onClick={() => setFinanceSubTab(st.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--gt-radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: financeSubTab === st.key ? '#FFFFFF' : 'transparent',
                    color: financeSubTab === st.key ? 'var(--gt-dark)' : 'var(--gt-text-muted)'
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* VENDOR PAYOUTS */}
          {financeSubTab === 'vendors' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: 'var(--gt-radius-xl)',
                    backgroundColor: 'var(--gt-bg-card-hover)',
                    border: '1px solid var(--gt-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  {vendorApps.length > 0 ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1rem' }}>{vendorApps[0].storeName}</strong>
                        <span className="gt-badge gt-badge-orange">{vendorApps[0].address}</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)', marginTop: '4px' }}>
                        Delivered Sales: <strong>₹{vendorFinance?.grossSales || 0}</strong> • Platform Commission ({opSettings?.vendorCommissionPercent ?? 0}%): <strong>-₹{vendorFinance?.platformDeductions || 0}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', marginTop: '2px' }}>
                        Net Payable: ₹{vendorFinance?.netPayable || 0} • Paid to Date: ₹{vendorFinance?.totalPaid || 0}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: 'var(--gt-text-muted)' }}>
                      No merchant stores registered yet.
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>Outstanding Balance</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gt-primary)' }}>
                        ₹{vendorFinance?.remainingBalance || 0}
                      </div>
                    </div>

                    <button
                      onClick={() => openPayoutModal('VENDOR', vendorApps[0]?.vendorProfileId || vendorApps[0]?.id || 'vendor-1', vendorApps[0]?.storeName || 'Merchant Partner', vendorFinance?.remainingBalance || 0)}
                      disabled={!vendorFinance || vendorFinance.remainingBalance <= 0 || vendorApps.length === 0}
                      className="gt-btn gt-btn-primary gt-btn-sm"
                    >
                      Mark as Paid
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RIDER PAYOUTS */}
          {financeSubTab === 'riders' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: 'var(--gt-radius-xl)',
                    backgroundColor: 'var(--gt-bg-card-hover)',
                    border: '1px solid var(--gt-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  {riderApps.length > 0 ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1rem' }}>{riderApps[0].fullName} ({riderApps[0].vehicle || 'Two-Wheeler'})</strong>
                        <span className="gt-badge gt-badge-green">Active Fleet</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)', marginTop: '4px' }}>
                        Completed Trips: <strong>{riderFinance?.completedDeliveries || 0}</strong> • Rate: <strong>₹10 base + ₹3 delivery (₹13/trip)</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', marginTop: '2px' }}>
                        Total Earned: ₹{riderFinance?.totalEarned || 0} • Disbursed: ₹{riderFinance?.totalPaid || 0}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: 'var(--gt-text-muted)' }}>
                      No delivery riders registered yet.
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>Trip Earnings Due</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gt-primary)' }}>
                        ₹{riderFinance?.remainingBalance || 0}
                      </div>
                    </div>

                    <button
                      onClick={() => openPayoutModal('RIDER', riderApps[0]?.id || 'rider-1', riderApps[0]?.fullName || 'Delivery Rider', riderFinance?.remainingBalance || 0)}
                      disabled={!riderFinance || riderFinance.remainingBalance <= 0 || riderApps.length === 0}
                      className="gt-btn gt-btn-primary gt-btn-sm"
                    >
                      Disburse Earning
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COD CASH RECONCILIATION */}
          {financeSubTab === 'cod' && (
            <div>
              <div
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--gt-bg-card-hover)',
                  borderRadius: 'var(--gt-radius-xl)',
                  border: '1px solid var(--gt-border-subtle)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>Rider COD Physical Cash Held</div>
                    <strong style={{ fontSize: '1.125rem' }}>Rahul Das (AS-24-9182)</strong>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)', marginTop: '4px' }}>
                      Total Collected: ₹{riderFinance?.codCollected || 0} • Deposited: ₹{riderFinance?.codRemitted || 0}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>Cash Outstanding</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#EF4444' }}>
                        ₹{riderFinance?.cashOutstanding || 0}
                      </div>
                    </div>

                    <button
                      onClick={() => setIsRemitModalOpen(true)}
                      disabled={!riderFinance || riderFinance.cashOutstanding <= 0}
                      className="gt-btn gt-btn-primary gt-btn-sm"
                    >
                      Record Cash Remittance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTLEMENT DISBURSEMENT HISTORY */}
          {financeSubTab === 'history' && (
            <div>
              {settlementHistory.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', padding: '20px 0' }}>
                  No payment disbursements recorded yet. Use "Mark as Paid" to disburse funds.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {settlementHistory.map(tx => (
                    <div
                      key={tx.id}
                      style={{
                        padding: '14px 18px',
                        borderRadius: 'var(--gt-radius-lg)',
                        backgroundColor: 'var(--gt-bg-card-hover)',
                        border: '1px solid var(--gt-border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                          {tx.recipientName} ({tx.recipientType})
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)', marginTop: '2px' }}>
                          Ref: {tx.paymentReference} • Method: {tx.paymentMethod} • By: {tx.settledBy}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-secondary)', marginTop: '2px' }}>
                          Note: {tx.notes}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gt-success)' }}>
                          -₹{tx.amountPaid}
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
      )}

      {/* PARTNER APPLICATIONS TAB */}
      {activeTab === 'partners' && (
        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '24px', borderRadius: 'var(--gt-radius-2xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>
            Store Partner Applications ({vendorApps.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vendorApps.map(v => (
              <div
                key={v.id}
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--gt-radius-lg)',
                  backgroundColor: 'var(--gt-bg-card-hover)',
                  border: '1px solid var(--gt-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{v.storeName}</strong>
                    <span className="gt-badge gt-badge-green">{v.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gt-text-secondary)', marginTop: '2px' }}>
                    Owner: {v.ownerName} • {v.phone} • {v.address}, {v.city}
                  </div>
                </div>

                {v.status !== 'APPROVED' ? (
                  <button onClick={() => handleApproveVendor(v.id)} className="gt-btn gt-btn-primary gt-btn-sm">
                    Approve Store
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--gt-success)', fontWeight: 600 }}>
                    ✓ Active Partner
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DELIVERY & PRICING RULES SETTINGS */}
      {activeTab === 'settings' && (
        <div style={{ backgroundColor: 'var(--gt-bg-surface)', padding: '24px', borderRadius: 'var(--gt-radius-2xl)', border: '1px solid var(--gt-border-subtle)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '4px' }}>
            Authoritative Delivery & Operational Settings
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', marginBottom: '20px' }}>
            Configure distance bounds, base fees, platform convenience fees, and rider compensation rules.
          </p>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                Service Radius Cutoff (KM)
              </label>
              <input
                type="number"
                step="0.5"
                value={opSettings.serviceRadiusKm}
                onChange={(e) => setOpSettings({ ...opSettings, serviceRadiusKm: Number(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--gt-radius-md)', border: '1px solid var(--gt-border-default)' }}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>GharTak default is 7.0 KM. Stores outside this radius are not serviceable.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Base Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  value={opSettings.baseDeliveryFeePaise / 100}
                  onChange={(e) => setOpSettings({ ...opSettings, baseDeliveryFeePaise: Number(e.target.value) * 100 })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--gt-radius-md)', border: '1px solid var(--gt-border-default)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Additional Fee per KM (₹)
                </label>
                <input
                  type="number"
                  value={opSettings.additionalFeePaise / 100}
                  onChange={(e) => setOpSettings({ ...opSettings, additionalFeePaise: Number(e.target.value) * 100 })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--gt-radius-md)', border: '1px solid var(--gt-border-default)' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Platform Convenience Fee (₹)
                </label>
                <input
                  type="number"
                  value={opSettings.platformConvenienceFeePaise / 100}
                  onChange={(e) => setOpSettings({ ...opSettings, platformConvenienceFeePaise: Number(e.target.value) * 100 })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--gt-radius-md)', border: '1px solid var(--gt-border-default)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Vendor Commission (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={opSettings.vendorCommissionPercent}
                  onChange={(e) => setOpSettings({ ...opSettings, vendorCommissionPercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--gt-radius-md)', border: '1px solid var(--gt-border-default)' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="gt-btn gt-btn-primary" style={{ width: 'fit-content', marginTop: '8px' }}>
              Save Operational Settings
            </button>
          </form>
        </div>
      )}

      {/* MARK AS PAID MODAL (Supports Full & Partial Payments) */}
      {isPayoutModalOpen && (
        <div className="gt-modal-overlay" onClick={() => setIsPayoutModalOpen(false)}>
          <div className="gt-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="gt-modal-header">
              <h3 className="gt-modal-title">Disburse Settlement Payment</h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="gt-icon-btn">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="gt-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>Recipient</div>
                <strong style={{ fontSize: '0.9375rem' }}>{payoutTarget?.name} ({payoutTarget?.type})</strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Payment Amount (₹) — Max: ₹{payoutTarget?.maxAmount}
                </label>
                <input
                  type="number"
                  max={payoutTarget?.maxAmount}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--gt-radius-md)', border: '1px solid var(--gt-border-default)', fontSize: '1.125rem', fontWeight: 800 }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                  Partial payments are fully supported. Overpayment is strictly prevented.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Payment Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--gt-radius-md)', border: '1px solid var(--gt-border-default)' }}
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="BANK_TRANSFER">Bank IMPS / NEFT Transfer</option>
                  <option value="CASH">Physical Cash Settlement</option>
                  <option value="ONLINE">Online Direct Clearing</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Payment Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--gt-radius-md)', border: '1px solid var(--gt-border-default)' }}
                  required
                />
              </div>

              <button type="submit" className="gt-btn gt-btn-primary gt-btn-full" style={{ marginTop: '8px' }}>
                Confirm Disbursement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RECORD RIDER REMITTANCE MODAL */}
      {isRemitModalOpen && (
        <div className="gt-modal-overlay" onClick={() => setIsRemitModalOpen(false)}>
          <div className="gt-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="gt-modal-header">
              <h3 className="gt-modal-title">Record Rider COD Cash Deposit</h3>
              <button onClick={() => setIsRemitModalOpen(false)} className="gt-icon-btn">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitRemit} className="gt-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>Rider Cash Outstanding</div>
                <strong style={{ fontSize: '1.25rem', color: '#EF4444' }}>₹{riderFinance?.cashOutstanding || 0}</strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Cash Deposited at Hailakandi Hub (₹)
                </label>
                <input
                  type="number"
                  max={riderFinance?.cashOutstanding}
                  placeholder={`Up to ₹${riderFinance?.cashOutstanding}`}
                  value={remitAmount}
                  onChange={(e) => setRemitAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--gt-radius-md)', border: '1px solid var(--gt-border-default)', fontSize: '1.125rem', fontWeight: 800 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  Remittance Receipt / Deposit Slip
                </label>
                <input
                  type="text"
                  placeholder="e.g. CASH-SLIP-0912"
                  value={remitRef}
                  onChange={(e) => setRemitRef(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--gt-radius-md)', border: '1px solid var(--gt-border-default)' }}
                />
              </div>

              <button type="submit" className="gt-btn gt-btn-primary gt-btn-full" style={{ marginTop: '8px' }}>
                Record Cash Remittance
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

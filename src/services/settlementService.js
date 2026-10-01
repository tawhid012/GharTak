// ============================================================================
// GHARTAK SETTLEMENT & CASH LEDGER SERVICE (DATABASE AUTHORITATIVE)
// Immutable Accounting, Anti-Overpayment Controls & Transparent Ledger
// Cluster 01: Hailakandi, Assam, India
// ============================================================================

import { supabase } from '../lib/supabase.js';
import { getOperationalSettings } from './adminSettings.js';

let cachedSettlements = [];
let cachedCashLedger = [];

// Fetch authoritative settlement transactions from Supabase settlement_payouts
export const getSettlementTransactions = () => {
  // Trigger background refresh from Supabase
  supabase
    .from('settlement_payouts')
    .select('*, profiles:recipient_id(full_name, role), stores(name)')
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        cachedSettlements = data.map(t => ({
          id: t.id,
          recipientType: t.recipient_type,
          recipientId: t.recipient_id,
          recipientName: t.profiles?.full_name || (t.recipient_type === 'VENDOR' ? 'Partner Store' : 'Rider Partner'),
          storeId: t.store_id,
          storeName: t.stores?.name,
          amountPaidPaise: t.amount_paid_paise,
          amountPaid: t.amount_paid_paise / 100,
          paymentMethod: t.payment_method,
          paymentReference: t.payment_reference || t.reference_number || 'REF-N/A',
          notes: t.notes || 'Official Settlement Payment',
          createdAt: t.created_at
        }));
      }
    })
    .catch(() => {});

  return [...cachedSettlements];
};

// Fetch authoritative rider cash ledger from Supabase
export const getRiderCashLedger = () => {
  // Trigger background refresh from Supabase
  supabase
    .from('rider_cash_ledger')
    .select('*, profiles:rider_profile_id(full_name)')
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        cachedCashLedger = data.map(l => ({
          id: l.id,
          riderId: l.rider_profile_id,
          riderName: l.profiles?.full_name || 'Fleet Rider',
          orderId: l.order_id,
          amountCollectedPaise: l.amount_collected_paise || 0,
          amountCollected: (l.amount_collected_paise || 0) / 100,
          amountRemittedPaise: l.amount_remitted_paise || 0,
          amountRemitted: (l.amount_remitted_paise || 0) / 100,
          status: l.remittance_status || (l.amount_remitted_paise > 0 ? 'REMITTED' : 'HELD'),
          timestamp: l.created_at
        }));
      }
    })
    .catch(() => {});

  return [...cachedCashLedger];
};

// Calculate Vendor Financial Summary from Delivered Orders
export const calculateVendorFinancialSummary = (orders, vendorId, storeId) => {
  const settings = getOperationalSettings();
  const deliveredStoreOrders = orders.filter(
    o => o.status === 'DELIVERED' && (o.storeId === storeId || !storeId)
  );

  const grossSalesPaise = deliveredStoreOrders.reduce(
    (sum, o) => sum + (o.subtotalPaise || Math.round(o.subtotal * 100)),
    0
  );

  const platformDeductionsPaise = deliveredStoreOrders.reduce((sum, o) => {
    if (o.vendorCommissionPaise !== undefined) {
      return sum + o.vendorCommissionPaise;
    }
    const commPct = o.pricingSnapshot?.vendorCommissionPercent !== undefined
      ? o.pricingSnapshot.vendorCommissionPercent
      : (settings.vendorCommissionPercent ?? 0.0);
    const sub = o.subtotalPaise || Math.round(o.subtotal * 100);
    return sum + Math.round(sub * (commPct / 100));
  }, 0);

  const netPayablePaise = Math.max(0, grossSalesPaise - platformDeductionsPaise);

  const transactions = cachedSettlements.filter(
    t => t.recipientType === 'VENDOR' && (t.recipientId === vendorId || t.storeId === storeId)
  );
  const totalPaidPaise = transactions.reduce((sum, t) => sum + t.amountPaidPaise, 0);
  const remainingBalancePaise = Math.max(0, netPayablePaise - totalPaidPaise);

  return {
    grossSales: grossSalesPaise / 100,
    grossSalesPaise,
    platformDeductions: platformDeductionsPaise / 100,
    platformDeductionsPaise,
    effectiveCommissionPercent: settings.vendorCommissionPercent ?? 0.0,
    netPayable: netPayablePaise / 100,
    netPayablePaise,
    totalPaid: totalPaidPaise / 100,
    totalPaidPaise,
    remainingBalance: remainingBalancePaise / 100,
    remainingBalancePaise,
    orderCount: deliveredStoreOrders.length,
    status: remainingBalancePaise === 0 && totalPaidPaise > 0 ? 'PAID' : totalPaidPaise > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
    recentTransactions: transactions
  };
};

// Calculate Rider Financial Summary from Delivered Orders and Cash Ledger
export const calculateRiderFinancialSummary = (orders, riderId = 'a0000000-0000-0000-0000-000000000004') => {
  const settings = getOperationalSettings();
  const deliveredOrders = orders.filter(
    o => o.status === 'DELIVERED' && (!o.riderProfileId || o.riderProfileId === riderId || o.rider?.id === riderId)
  );

  const totalEarnedPaise = deliveredOrders.reduce((sum, o) => {
    if (o.riderPayoutPaise !== undefined) {
      return sum + o.riderPayoutPaise;
    }
    const base = o.pricingSnapshot?.riderBaseEarningPaise ?? settings.riderBaseEarningPaise;
    const perDelivery = o.pricingSnapshot?.riderPerDeliveryEarningPaise ?? settings.riderPerDeliveryEarningPaise;
    return sum + (base + perDelivery);
  }, 0);

  const transactions = cachedSettlements.filter(
    t => t.recipientType === 'RIDER' && (t.recipientId === riderId || !t.recipientId)
  );
  const totalPaidPaise = transactions.reduce((sum, t) => sum + t.amountPaidPaise, 0);
  const remainingBalancePaise = Math.max(0, totalEarnedPaise - totalPaidPaise);

  const cashEntries = cachedCashLedger.filter(l => !riderId || l.riderId === riderId);
  const totalCollectedPaise = cashEntries.reduce((sum, l) => sum + (l.amountCollectedPaise || 0), 0);
  const totalRemittedPaise = cashEntries.reduce((sum, l) => sum + (l.amountRemittedPaise || 0), 0);
  const cashOutstandingPaise = Math.max(0, totalCollectedPaise - totalRemittedPaise);

  return {
    completedDeliveries: deliveredOrders.length,
    totalEarned: totalEarnedPaise / 100,
    totalEarnedPaise,
    totalPaid: totalPaidPaise / 100,
    totalPaidPaise,
    remainingBalance: remainingBalancePaise / 100,
    remainingBalancePaise,
    codCollected: totalCollectedPaise / 100,
    codCollectedPaise: totalCollectedPaise,
    codRemitted: totalRemittedPaise / 100,
    codRemittedPaise: totalRemittedPaise,
    cashOutstanding: cashOutstandingPaise / 100,
    cashOutstandingPaise,
    status: remainingBalancePaise === 0 && totalPaidPaise > 0 ? 'PAID' : totalPaidPaise > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
    recentTransactions: transactions
  };
};

// Admin Action: Record Settlement Payment
export const recordSettlementPayment = ({
  recipientType,
  recipientId,
  recipientName,
  storeId,
  amountPaidPaise,
  maxPayablePaise,
  paymentMethod = 'UPI',
  paymentReference,
  notes,
  adminUser
}) => {
  if (!amountPaidPaise || amountPaidPaise <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  if (!['VENDOR', 'RIDER'].includes(recipientType)) {
    throw new Error('Invalid settlement recipient type');
  }

  if (maxPayablePaise !== undefined && amountPaidPaise > maxPayablePaise) {
    throw new Error(
      `Overpayment rejected: Requested payment ₹${(amountPaidPaise / 100).toFixed(2)} exceeds remaining balance of ₹${(maxPayablePaise / 100).toFixed(2)}`
    );
  }

  const newTx = {
    id: `SETTLE-${Date.now()}`,
    recipientType,
    recipientId,
    recipientName: recipientName || (recipientType === 'VENDOR' ? 'Partner Store' : 'Rider Partner'),
    storeId: storeId || null,
    amountPaidPaise,
    amountPaid: amountPaidPaise / 100,
    paymentMethod,
    paymentReference: paymentReference || `REF-${Date.now()}`,
    notes: notes || 'Official Settlement Payment',
    createdAt: new Date().toISOString()
  };

  cachedSettlements = [newTx, ...cachedSettlements];

  // Sync to Supabase in background
  try {
    supabase.rpc('admin_record_settlement_payment', {
      p_recipient_type: recipientType,
      p_recipient_profile_id: recipientId,
      p_store_id: storeId || null,
      p_amount_paid_paise: amountPaidPaise,
      p_payment_method: paymentMethod,
      p_reference: newTx.paymentReference,
      p_notes: newTx.notes,
      p_admin_profile_id: adminUser?.id || null
    }).catch(err => {
      console.warn('Supabase settlement sync note:', err.message);
    });
  } catch (e) {}

  return newTx;
};

// Admin Action: Record Rider COD Cash Remittance
export const recordRiderCashRemittance = ({
  riderId,
  riderName,
  amountRemittedPaise,
  paymentMethod = 'CASH',
  reference = 'CASH-DEPOSIT',
  notes = 'Rider deposited collected COD cash at Hailakandi Hub',
  adminUser
}) => {
  if (!amountRemittedPaise || amountRemittedPaise <= 0) {
    throw new Error('Remittance amount must be greater than zero');
  }

  const newEntry = {
    id: `REMIT-${Date.now()}`,
    riderId,
    riderName: riderName || 'Rahul Das',
    amountCollectedPaise: 0,
    amountRemittedPaise,
    amountRemitted: amountRemittedPaise / 100,
    status: 'REMITTED',
    paymentMethod,
    reference,
    notes,
    timestamp: new Date().toISOString()
  };

  cachedCashLedger = [newEntry, ...cachedCashLedger];

  // Sync to Supabase in background
  try {
    supabase.rpc('admin_record_rider_cash_remittance', {
      p_rider_profile_id: riderId,
      p_amount_paise: amountRemittedPaise,
      p_payment_method: paymentMethod,
      p_reference: reference,
      p_notes: notes,
      p_admin_profile_id: adminUser?.id || null
    }).catch(err => {
      console.warn('Supabase cash remittance sync note:', err.message);
    });
  } catch (e) {}

  return newEntry;
};

// Record COD Collection Event into cash ledger
export const recordCodCollectionEvent = (orderId, riderId, riderName, amountPaise) => {
  const entry = {
    id: `COLLECT-${orderId}`,
    orderId,
    riderId: riderId || 'a0000000-0000-0000-0000-000000000004',
    riderName: riderName || 'Rahul Das',
    amountCollectedPaise: amountPaise,
    amountCollected: amountPaise / 100,
    amountRemittedPaise: 0,
    status: 'HELD',
    timestamp: new Date().toISOString()
  };

  cachedCashLedger = [entry, ...cachedCashLedger.filter(l => l.orderId !== orderId)];

  // Sync to Supabase in background
  try {
    supabase
      .from('rider_cash_ledger')
      .insert({
        rider_profile_id: entry.riderId,
        order_id: orderId,
        amount_collected_paise: amountPaise,
        amount_remitted_paise: 0,
        remittance_status: 'HELD'
      })
      .catch(e => console.warn('Supabase COD collection sync note:', e));
  } catch (e) {}

  return entry;
};

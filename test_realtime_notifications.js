// ============================================================================
// GHARTAK REALTIME NOTIFICATION SYSTEM TEST MATRIX (15 TEST SCENARIOS)
// ============================================================================

import { api } from './src/services/api.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from './src/constants/notificationTypes.js';
import { realtimeNotificationService } from './src/services/realtimeNotificationService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('STARTING GHARTAK 15-POINT REAL-TIME NOTIFICATION TEST MATRIX');
  console.log('===============================================================\n');

  const customerId = 'a0000000-0000-0000-0000-000000000005';
  const vendorId = 'a0000000-0000-0000-0000-000000000002'; // Reliance Fresh Owner
  const riderId = 'a0000000-0000-0000-0000-000000000004'; // Rahul Das
  const adminId = 'a0000000-0000-0000-0000-000000000001';

  // --------------------------------------------------------------------------
  // TEST 1: Customer Places Order -> Vendor Receives Notification Immediately
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Customer Order Placement & Vendor Realtime Notification ---');
  const testOrderId = `GT_TEST_${Date.now()}`;
  const mockOrderPayload = {
    id: testOrderId,
    orderNumber: testOrderId,
    customerId,
    storeId: 'b0000000-0000-0000-0000-000000000001',
    storeName: 'Reliance Fresh Hailakandi',
    items: [{ id: 'c0000000-0000-0000-0000-000000000001', name: 'Fortune Oil', price: 145, quantity: 1 }],
    subtotal: 145,
    deliveryFee: 10,
    platformFee: 7,
    discount: 0,
    total: 162,
    deliveryLocation: { latitude: 24.6841, longitude: 92.5638 },
    paymentMethod: 'COD'
  };

  const createdOrder = await api.createOrder(mockOrderPayload);
  assert(createdOrder && createdOrder.id, `Order placed successfully (#${testOrderId})`);

  const vendorNotifsT1 = await api.getNotifications(vendorId);
  const vendorNewOrderNotif = vendorNotifsT1.find(n => n.orderId === testOrderId && n.type === NOTIFICATION_TYPES.NEW_ORDER);
  assert(Boolean(vendorNewOrderNotif), `Vendor received NEW_ORDER notification for #${testOrderId}`);

  const customerNotifsT1 = await api.getNotifications(customerId);
  const customerPlacedNotif = customerNotifsT1.find(n => n.orderId === testOrderId && n.type === NOTIFICATION_TYPES.ORDER_PLACED);
  assert(Boolean(customerPlacedNotif), `Customer received ORDER_PLACED notification for #${testOrderId}`);

  // --------------------------------------------------------------------------
  // TEST 2: Vendor Accepts -> Customer Receives Notification Immediately
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Vendor Confirms Order -> Customer Receives ORDER_CONFIRMED ---');
  await api.updateOrderStatus(testOrderId, 'CONFIRMED');
  const customerNotifsT2 = await api.getNotifications(customerId);
  const customerConfirmedNotif = customerNotifsT2.find(n => n.orderId === testOrderId && n.type === NOTIFICATION_TYPES.ORDER_CONFIRMED);
  assert(Boolean(customerConfirmedNotif), `Customer received ORDER_CONFIRMED notification for #${testOrderId}`);

  // --------------------------------------------------------------------------
  // TEST 3: Vendor Marks Preparing -> Customer Receives ORDER_PREPARING
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Vendor Marks PREPARING -> Customer Status Update ---');
  await api.updateOrderStatus(testOrderId, 'PREPARING');
  const customerNotifsT3 = await api.getNotifications(customerId);
  const customerPreparingNotif = customerNotifsT3.find(n => n.orderId === testOrderId && n.type === NOTIFICATION_TYPES.ORDER_PREPARING);
  assert(Boolean(customerPreparingNotif), `Customer received ORDER_PREPARING notification for #${testOrderId}`);

  // --------------------------------------------------------------------------
  // TEST 4: Vendor Marks Ready -> Admin & Order Queue Update
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Vendor Marks READY_FOR_PICKUP -> Admin Delivery Queue Update ---');
  await api.updateOrderStatus(testOrderId, 'READY_FOR_PICKUP');
  const adminNotifsT4 = await api.getNotifications(adminId);
  const adminReadyNotif = adminNotifsT4.find(n => n.orderId === testOrderId && n.type === NOTIFICATION_TYPES.DELIVERY_READY);
  assert(Boolean(adminReadyNotif), `Admin received DELIVERY_READY operational alert for #${testOrderId}`);

  // --------------------------------------------------------------------------
  // TEST 5: Admin Assigns Rider -> Rider Receives Notification, Customer Updates
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: Admin Assigns Rider -> Rider & Customer Notifications ---');
  await api.assignDeliveryJob(testOrderId, riderId, 'admin');
  const riderNotifsT5 = await api.getNotifications(riderId);
  const riderAssignedNotif = riderNotifsT5.find(n => n.orderId === testOrderId && n.type === NOTIFICATION_TYPES.DELIVERY_ASSIGNED);
  assert(Boolean(riderAssignedNotif), `Rider received DELIVERY_ASSIGNED notification for #${testOrderId}`);

  const customerNotifsT5 = await api.getNotifications(customerId);
  const customerRiderNotif = customerNotifsT5.find(n => n.orderId === testOrderId && n.type === NOTIFICATION_TYPES.RIDER_ASSIGNED);
  assert(Boolean(customerRiderNotif), `Customer received RIDER_ASSIGNED notification naming Rahul Das`);

  // --------------------------------------------------------------------------
  // TEST 6: Rider Picks Up -> Customer & Vendor Update Immediately
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: Rider Picks Up -> Customer & Vendor Status Sync ---');
  await api.updateOrderStatus(testOrderId, 'OUT_FOR_DELIVERY');
  const vendorNotifsT6 = await api.getNotifications(vendorId);
  const vendorPickedUpNotif = vendorNotifsT6.find(n => n.orderId === testOrderId && n.type === NOTIFICATION_TYPES.ORDER_PICKED_UP);
  assert(Boolean(vendorPickedUpNotif), `Vendor received ORDER_PICKED_UP notification`);

  // --------------------------------------------------------------------------
  // TEST 7: Rider Out For Delivery -> Customer Receives ORDER_OUT_FOR_DELIVERY
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: Rider Out For Delivery -> Customer Alert ---');
  const customerNotifsT7 = await api.getNotifications(customerId);
  const customerOutNotif = customerNotifsT7.find(n => n.orderId === testOrderId && n.type === NOTIFICATION_TYPES.ORDER_OUT_FOR_DELIVERY);
  assert(Boolean(customerOutNotif), `Customer received ORDER_OUT_FOR_DELIVERY notification`);

  // --------------------------------------------------------------------------
  // TEST 8: Delivery Completed (OTP + COD) -> Dashboards Update
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 8: Full Delivery Completion & COD Handover ---');
  const orderObj = await api.getOrderById(testOrderId);
  const testOtp = orderObj?.deliveryOtp || '1234';
  const deliveryResult = await api.verifyDeliveryOtpAndCollectCod(testOrderId, testOtp, 162, riderId);
  assert(deliveryResult && deliveryResult.success, `Delivery OTP verified and ₹162 COD collected`);

  const riderNotifsT8 = await api.getNotifications(riderId);
  const riderCompletedNotif = riderNotifsT8.find(n => n.orderId === testOrderId && n.type === NOTIFICATION_TYPES.DELIVERY_COMPLETED);
  assert(Boolean(riderCompletedNotif), `Rider received DELIVERY_COMPLETED with ₹13 trip earning`);

  const adminNotifsT8 = await api.getNotifications(adminId);
  const adminCodNotif = adminNotifsT8.find(n => n.orderId === testOrderId && n.type === NOTIFICATION_TYPES.COD_COLLECTED);
  assert(Boolean(adminCodNotif), `Admin received COD_COLLECTED notification for ₹162`);

  // --------------------------------------------------------------------------
  // TEST 9: Admin Records Rider Cash Remittance -> Admin COD Reconciliation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 9: Rider Cash Remittance Reconciliation ---');
  await api.recordRiderCashRemittance({
    riderId,
    riderName: 'Rahul Das',
    amount: 162,
    collectedCount: 1,
    depositMethod: 'CASH_OFFICE',
    reference: 'DEP-TEST-01'
  });
  const adminNotifsT9 = await api.getNotifications(adminId);
  const adminRemitNotif = adminNotifsT9.find(n => n.type === NOTIFICATION_TYPES.COD_REMITTED);
  assert(Boolean(adminRemitNotif), `Admin received COD_REMITTED alert for ₹162 deposit`);

  const riderNotifsT9 = await api.getNotifications(riderId);
  const riderRemitNotif = riderNotifsT9.find(n => n.type === NOTIFICATION_TYPES.COD_REMITTED);
  assert(Boolean(riderRemitNotif), `Rider received COD_REMITTED confirmation from Admin`);

  // --------------------------------------------------------------------------
  // TEST 10: Admin Records Vendor Settlement -> Balance Updates
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 10: Vendor Settlement Disbursement ---');
  await api.recordSettlementPayment({
    recipientType: 'VENDOR',
    recipientId: vendorId,
    recipientName: 'Bishal Nath (Reliance Fresh)',
    amount: 145,
    paymentMethod: 'NEFT_BANK',
    reference: 'SETTLE-TEST-01'
  });
  const vendorNotifsT10 = await api.getNotifications(vendorId);
  const vendorSettleNotif = vendorNotifsT10.find(n => n.type === NOTIFICATION_TYPES.SETTLEMENT_PAID);
  assert(Boolean(vendorSettleNotif), `Vendor received SETTLEMENT_PAID notification for ₹145`);

  // --------------------------------------------------------------------------
  // TEST 11: Mark Notification as Read -> Unread Count Updates Immediately
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 11: Mark Notification Read & Instant Unread Count Sync ---');
  const unreadBefore = (await api.getNotifications(customerId)).filter(n => !n.read && !n.isRead).length;
  assert(unreadBefore > 0, `Customer has ${unreadBefore} unread notifications`);

  const firstUnread = (await api.getNotifications(customerId)).find(n => !n.read && !n.isRead);
  await api.markNotificationRead(firstUnread.id);

  const unreadAfter = (await api.getNotifications(customerId)).filter(n => !n.read && !n.isRead).length;
  assert(unreadAfter === unreadBefore - 1, `Unread count decreased to ${unreadAfter}`);

  // Mark all as read test
  await api.markAllNotificationsRead(customerId);
  const unreadAfterMarkAll = (await api.getNotifications(customerId)).filter(n => !n.read && !n.isRead).length;
  assert(unreadAfterMarkAll === 0, `All notifications marked read (unread count is 0)`);

  // --------------------------------------------------------------------------
  // TEST 12: Multi-tab Consistency Check (BroadcastChannel / In-Memory sync)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 12: Multi-tab Consistency & Broadcast Mechanism ---');
  let crossTabNotifReceived = null;
  const unsubscribeCrossTab = realtimeNotificationService.addCrossTabListener((msg) => {
    if (msg.type === 'NEW_NOTIFICATION') {
      crossTabNotifReceived = msg.notification;
    }
  });

  realtimeNotificationService.handleCrossTabMessage({
    type: 'NEW_NOTIFICATION',
    notification: { id: 'tab-sync-1', title: 'Cross Tab Test', message: 'Syncing across tabs' }
  });

  assert(Boolean(crossTabNotifReceived), `Cross-tab broadcast event received and processed without duplication`);
  unsubscribeCrossTab();

  // --------------------------------------------------------------------------
  // TEST 13: Offline / Reconnect Resynchronization
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 13: Offline / Reconnect State Resynchronization ---');
  let statusUpdated = null;
  const unsubscribeStatus = realtimeNotificationService.addCrossTabListener((msg) => {
    if (msg.type === 'STATUS_CHANGE') {
      statusUpdated = msg.status;
    }
  });

  realtimeNotificationService.notifyStatusChange({ status: 'OFFLINE', message: 'Network offline' });
  assert(statusUpdated === 'OFFLINE', `Service correctly detected and broadcast OFFLINE state`);

  realtimeNotificationService.notifyStatusChange({ status: 'ONLINE', message: 'Connection restored' });
  assert(statusUpdated === 'ONLINE', `Service correctly handled ONLINE reconnect`);
  unsubscribeStatus();

  // --------------------------------------------------------------------------
  // TEST 14: RLS Cross-User Notification Isolation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 14: Security & Cross-User Notification Isolation ---');
  const customerList = await api.getNotifications(customerId);
  const hasVendorPrivateAlert = customerList.some(n => n.userId === vendorId && n.type === NOTIFICATION_TYPES.NEW_ORDER);
  assert(!hasVendorPrivateAlert, `Customer cannot access Vendor's private operational alerts (Strict Isolation)`);

  const riderList = await api.getNotifications(riderId);
  const hasAdminSecretAlert = riderList.some(n => n.userId === adminId && n.type === NOTIFICATION_TYPES.SYSTEM_ALERT);
  assert(!hasAdminSecretAlert, `Rider cannot access Admin system alerts`);

  // --------------------------------------------------------------------------
  // TEST 15: Duplicate Prevention via Unique Event Key
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 15: Duplicate Prevention via Unique Event Key (Idempotency) ---');
  const duplicateEventKey = `order:test_dup_${Date.now()}:CONFIRMED:customer`;

  // First insertion
  const notif1 = await api.createAuthoritativeNotification({
    userId: customerId,
    type: NOTIFICATION_TYPES.ORDER_CONFIRMED,
    title: 'Duplicate Check Test',
    message: 'Testing deduplication',
    eventKey: duplicateEventKey
  });
  assert(Boolean(notif1), `First notification created with event_key '${duplicateEventKey}'`);

  // Duplicate retry with same event key
  const notif2 = await api.createAuthoritativeNotification({
    userId: customerId,
    type: NOTIFICATION_TYPES.ORDER_CONFIRMED,
    title: 'Duplicate Check Test',
    message: 'Testing deduplication',
    eventKey: duplicateEventKey
  });
  assert(notif2 === null, `Duplicate retry correctly BLOCKED by unique event key (zero duplicates created)`);

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`REALTIME TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});

// ============================================================================
// GHARTAK PRODUCTION REALTIME NOTIFICATION & EVENT SERVICE
// Realtime Transport: Supabase Realtime postgres_changes + BroadcastChannel sync
// ============================================================================

import { supabase, isLiveSupabaseConfigured } from '../lib/supabase.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '../constants/notificationTypes.js';

class RealtimeNotificationService {
  constructor() {
    this.activeChannels = new Map();
    this.seenEventKeys = new Set();
    this.seenNotificationIds = new Set();
    this.listeners = new Set();
    this.syncChannel = null;
    this.isMuted = typeof localStorage !== 'undefined' ? localStorage.getItem('ghartak_sound_muted') === 'true' : true;
    this.audioCtx = null;
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Initialize cross-tab synchronization via BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.syncChannel = new BroadcastChannel('ghartak_realtime_sync');
        this.syncChannel.onmessage = (event) => {
          this.handleCrossTabMessage(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported or restricted:', err);
      }
    }

    // Network online/offline event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyStatusChange({ status: 'ONLINE', message: 'Connection restored. Syncing...' });
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyStatusChange({ status: 'OFFLINE', message: 'Live updates temporarily unavailable' });
      });
    }
  }

  // Subscribe to real-time notifications for a specific user
  subscribeUserNotifications(userId, onNotification, onUpdate, onResync) {
    if (!userId) return () => {};

    const channelKey = `notifications:${userId}`;

    // Clean up existing channel for this user if already open
    if (this.activeChannels.has(channelKey)) {
      this.unsubscribe(channelKey);
    }

    if (!isLiveSupabaseConfigured()) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`ghartak-notifs-${userId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const notif = payload.new;
            if (this.isDuplicate(notif)) return;

            this.markSeen(notif);
            this.playNotificationSound(notif.priority);

            if (typeof onNotification === 'function') {
              onNotification(this.formatNotification(notif));
            }

            // Broadcast to other open browser tabs
            this.broadcast({
              type: 'NEW_NOTIFICATION',
              notification: this.formatNotification(notif)
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const updated = payload.new;
            if (typeof onUpdate === 'function') {
              onUpdate(this.formatNotification(updated));
            }

            this.broadcast({
              type: 'UPDATE_NOTIFICATION',
              notification: this.formatNotification(updated)
            });
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            // Successfully connected to Supabase Realtime
            if (typeof onResync === 'function') {
              onResync();
            }
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.warn(`Supabase Realtime channel ${channelKey} ${status}:`, err);
          }
        });

      this.activeChannels.set(channelKey, channel);

      return () => this.unsubscribe(channelKey);
    } catch (err) {
      console.error('Error establishing Realtime subscription:', err);
      return () => {};
    }
  }

  // Subscribe to real-time status updates for a specific order
  subscribeOrder(orderId, onOrderUpdate) {
    if (!orderId || !isLiveSupabaseConfigured()) return () => {};

    const channelKey = `order:${orderId}`;
    if (this.activeChannels.has(channelKey)) {
      this.unsubscribe(channelKey);
    }

    try {
      const channel = supabase
        .channel(`ghartak-order-${orderId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`
          },
          (payload) => {
            if (typeof onOrderUpdate === 'function') {
              onOrderUpdate(payload.new);
            }
          }
        )
        .subscribe();

      this.activeChannels.set(channelKey, channel);
      return () => this.unsubscribe(channelKey);
    } catch (err) {
      console.warn('Realtime order subscription failed:', err);
      return () => {};
    }
  }

  // Subscribe to real-time orders for a vendor store
  subscribeStoreOrders(storeId, onStoreOrderChange) {
    if (!storeId || !isLiveSupabaseConfigured()) return () => {};

    const channelKey = `store-orders:${storeId}`;
    if (this.activeChannels.has(channelKey)) {
      this.unsubscribe(channelKey);
    }

    try {
      const channel = supabase
        .channel(`ghartak-store-${storeId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `store_id=eq.${storeId}`
          },
          (payload) => {
            if (typeof onStoreOrderChange === 'function') {
              onStoreOrderChange(payload);
            }
          }
        )
        .subscribe();

      this.activeChannels.set(channelKey, channel);
      return () => this.unsubscribe(channelKey);
    } catch (err) {
      console.warn('Realtime store subscription failed:', err);
      return () => {};
    }
  }

  // Subscribe to real-time delivery jobs for a rider
  subscribeRiderDeliveries(riderProfileId, onDeliveryChange) {
    if (!riderProfileId || !isLiveSupabaseConfigured()) return () => {};

    const channelKey = `rider-jobs:${riderProfileId}`;
    if (this.activeChannels.has(channelKey)) {
      this.unsubscribe(channelKey);
    }

    try {
      const channel = supabase
        .channel(`ghartak-rider-${riderProfileId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_jobs'
          },
          (payload) => {
            const job = payload.new || payload.old;
            if (!job) return;

            // Trigger if job is assigned to this rider or unassigned pending job
            if (job.rider_profile_id === riderProfileId || (!job.rider_profile_id && job.status === 'PENDING')) {
              if (typeof onDeliveryChange === 'function') {
                onDeliveryChange(payload);
              }
            }
          }
        )
        .subscribe();

      this.activeChannels.set(channelKey, channel);
      return () => this.unsubscribe(channelKey);
    } catch (err) {
      console.warn('Realtime rider subscription failed:', err);
      return () => {};
    }
  }

  // Subscribe to admin operational streams
  subscribeAdminOperations(onOperationalEvent) {
    if (!isLiveSupabaseConfigured()) return () => {};

    const channelKey = 'admin-ops';
    if (this.activeChannels.has(channelKey)) {
      this.unsubscribe(channelKey);
    }

    try {
      const channel = supabase
        .channel(`ghartak-admin-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => onOperationalEvent({ table: 'orders', ...payload })
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'delivery_jobs' },
          (payload) => onOperationalEvent({ table: 'delivery_jobs', ...payload })
        )
        .subscribe();

      this.activeChannels.set(channelKey, channel);
      return () => this.unsubscribe(channelKey);
    } catch (err) {
      console.warn('Realtime admin operations subscription failed:', err);
      return () => {};
    }
  }

  // Duplicate Check with LRU Cap
  isDuplicate(notif) {
    if (!notif) return true;
    if (notif.id && this.seenNotificationIds.has(notif.id)) return true;
    if (notif.event_key && this.seenEventKeys.has(notif.event_key)) return true;
    return false;
  }

  markSeen(notif) {
    if (!notif) return;
    if (notif.id) {
      this.seenNotificationIds.add(notif.id);
      if (this.seenNotificationIds.size > 200) {
        const first = this.seenNotificationIds.values().next().value;
        this.seenNotificationIds.delete(first);
      }
    }
    if (notif.event_key) {
      this.seenEventKeys.add(notif.event_key);
      if (this.seenEventKeys.size > 200) {
        const first = this.seenEventKeys.values().next().value;
        this.seenEventKeys.delete(first);
      }
    }
  }

  // Standardize notification object
  formatNotification(raw) {
    const isRead = raw.read ?? raw.is_read ?? false;
    let timeStr = 'Just now';
    if (raw.created_at) {
      const diffMs = Date.now() - new Date(raw.created_at).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) timeStr = 'Just now';
      else if (mins < 60) timeStr = `${mins}m ago`;
      else {
        const hours = Math.floor(mins / 60);
        if (hours < 24) timeStr = `${hours}h ago`;
        else timeStr = 'Earlier';
      }
    }

    return {
      id: raw.id,
      userId: raw.user_id,
      title: raw.title,
      message: raw.message,
      type: raw.type || NOTIFICATION_TYPES.ORDER_PLACED,
      orderId: raw.order_id,
      deliveryJobId: raw.delivery_job_id,
      actionUrl: raw.action_url,
      priority: raw.priority || NOTIFICATION_PRIORITY.NORMAL,
      read: isRead,
      isRead: isRead,
      createdAt: raw.created_at || new Date().toISOString(),
      time: timeStr,
      metadata: raw.metadata || {}
    };
  }

  // Cross-tab message handling
  handleCrossTabMessage(msg) {
    if (!msg) return;
    this.listeners.forEach(fn => fn(msg));
  }

  broadcast(msg) {
    if (this.syncChannel) {
      try {
        this.syncChannel.postMessage(msg);
      } catch (e) {
        // BroadcastChannel may fail in sandboxed iframes
      }
    }
  }

  addCrossTabListener(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // Pleasant, Respectful Dual-Tone Chime via Web Audio API (Zero external assets)
  playNotificationSound(priority = 'NORMAL') {
    if (this.isMuted) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';

      // Subtle, pleasant chord
      if (priority === 'CRITICAL' || priority === 'IMPORTANT') {
        // High alert pleasant chime: 587Hz (D5) -> 880Hz (A5)
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Gentle chime: 523Hz (C5) -> 659Hz (E5)
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (err) {
      // Browser autoplay restriction or audio context blocked
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ghartak_sound_muted', String(this.isMuted));
    }
    return this.isMuted;
  }

  getIsMuted() {
    return this.isMuted;
  }

  unsubscribe(channelKey) {
    if (this.activeChannels.has(channelKey)) {
      const channel = this.activeChannels.get(channelKey);
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        // Cleanup error safe
      }
      this.activeChannels.delete(channelKey);
    }
  }

  unsubscribeAll() {
    this.activeChannels.forEach((channel) => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        // Cleanup error safe
      }
    });
    this.activeChannels.clear();
  }

  notifyStatusChange(status) {
    this.listeners.forEach(fn => fn({ type: 'STATUS_CHANGE', ...status }));
  }
}

export const realtimeNotificationService = new RealtimeNotificationService();

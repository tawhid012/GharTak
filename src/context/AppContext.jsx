import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, AUTHORITATIVE_STORES } from '../services/api';
import { calculateDistanceKm, calculateDeliveryFeePaise } from '../services/marketplaceService';
import { getOperationalSettings } from '../services/adminSettings';
import { realtimeNotificationService } from '../services/realtimeNotificationService';
import { authService } from '../services/authService';

const AppContext = createContext(null);

const getInitialRoute = () => {
  try {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path === '/login') return { page: 'login', params: {} };
    if (path === '/register') return { page: 'register', params: {} };
    if (path === '/vendor/register') return { page: 'vendor-register', params: {} };
    if (path === '/rider/register') return { page: 'rider-register', params: {} };
    if (path === '/admin') return { page: 'admin', params: {} };
    if (path === '/admin/dashboard') return { page: 'admin-dashboard', params: {} };
    if (path === '/vendor') return { page: 'vendor-dashboard', params: {} };
    if (path === '/rider') return { page: 'rider-dashboard', params: {} };
    if (path === '/explore') return { page: 'explore', params: {} };
    if (path === '/cart') return { page: 'cart', params: {} };
    if (path === '/orders') return { page: 'orders', params: {} };
    if (path === '/profile') return { page: 'profile', params: {} };
  } catch (e) {
    console.warn('URL parsing fallback:', e);
  }
  return { page: 'home', params: {} };
};

const pageToPath = {
  home: '/',
  login: '/login',
  register: '/register',
  'vendor-register': '/vendor/register',
  'rider-register': '/rider/register',
  admin: '/admin',
  'admin-dashboard': '/admin/dashboard',
  'vendor-dashboard': '/vendor',
  'rider-dashboard': '/rider',
  explore: '/explore',
  cart: '/cart',
  orders: '/orders',
  profile: '/profile',
  checkout: '/checkout',
  'order-tracking': '/order-tracking',
  search: '/search',
  saved: '/saved'
};

export const AppProvider = ({ children }) => {
  // Navigation / Routing State
  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);
  const [historyStack, setHistoryStack] = useState([getInitialRoute()]);

  // Authoritative Customer GPS & Location State
  const [selectedLocation, setSelectedLocationState] = useState(() => api.getSelectedLocation());
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  // Cart State (Persisted in localStorage, verified against authoritative rules)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('ghartak_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Favourites State
  const [favourites, setFavourites] = useState(() => api.getFavourites());

  // User & Auth State (Central session)
  const [user, setUser] = useState(() => api.getCurrentAuth());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRedirectAction, setAuthRedirectAction] = useState(null);

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Toast System
  const [toast, setToast] = useState(null);

  // Search Global Query
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Data Fetch & Supabase Session Restoration
  useEffect(() => {
    const init = async () => {
      // 1. Check for real Supabase session
      try {
        const { user: authUser, profile } = await authService.getCurrentSession();
        if (authUser && profile) {
          setUser({
            id: profile.id,
            auth_user_id: authUser.id,
            name: profile.full_name,
            email: authUser.email,
            phone: profile.phone,
            role: profile.role,
            storeId: profile.storeId,
            storeName: profile.storeName,
            city: 'Hailakandi, Assam'
          });
        }
      } catch (err) {
        console.warn('Session init warning:', err);
      }

      // 2. Fetch operational data
      const [addrList, orderList, notifList] = await Promise.all([
        api.getAddresses(),
        api.getOrders(),
        api.getNotifications()
      ]);
      setAddresses(addrList);
      setSelectedAddress(addrList.find(a => a.isDefault) || addrList[0] || null);
      setOrders(orderList);
      if (orderList.length > 0) {
        setActiveTrackingOrderId(orderList[0].id);
      }
      setNotifications(notifList);
    };
    init();

    // Listen to real Supabase auth changes
    const unsubAuth = authService.onAuthStateChange((authUser, profile) => {
      if (authUser && profile) {
        setUser({
          id: profile.id,
          auth_user_id: authUser.id,
          name: profile.full_name,
          email: authUser.email,
          phone: profile.phone,
          role: profile.role,
          storeId: profile.storeId,
          storeName: profile.storeName,
          city: 'Hailakandi, Assam'
        });
      }
    });

    // Listen to browser popstate (back/forward)
    const handlePopState = () => {
      const route = getInitialRoute();
      setCurrentRoute(route);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      unsubAuth();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Realtime Notification Listener & Cross-Tab Sync
  useEffect(() => {
    if (!user?.id) return;

    // Load initial user notifications
    api.getNotifications(user.id).then(list => {
      if (Array.isArray(list)) {
        setNotifications(list);
      }
    });

    const unsubscribeRealtime = realtimeNotificationService.subscribeUserNotifications(
      user.id,
      (newNotif) => {
        setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
        if (newNotif.priority === 'IMPORTANT' || newNotif.priority === 'CRITICAL') {
          showToast(`🔔 ${newNotif.title}: ${newNotif.message}`, 'info', 4500);
        }
      },
      (updatedNotif) => {
        setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
      },
      () => {
        // Resync on reconnection
        api.getNotifications(user.id).then(list => {
          if (Array.isArray(list)) setNotifications(list);
        });
      }
    );

    const unsubscribeCrossTab = realtimeNotificationService.addCrossTabListener((msg) => {
      if (msg.type === 'NEW_NOTIFICATION' && msg.notification) {
        setNotifications(prev => [msg.notification, ...prev.filter(n => n.id !== msg.notification.id)]);
      } else if (msg.type === 'UPDATE_NOTIFICATION' && msg.notification) {
        setNotifications(prev => prev.map(n => n.id === msg.notification.id ? msg.notification : n));
      } else if (msg.type === 'STATUS_CHANGE') {
        if (msg.status === 'OFFLINE') {
          showToast(msg.message, 'warning', 3000);
        }
      }
    });

    return () => {
      unsubscribeRealtime();
      unsubscribeCrossTab();
    };
  }, [user?.id]);

  // Sync Cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ghartak_cart', JSON.stringify(cart));
    } catch (err) {
      console.warn('Error saving cart:', err);
    }
  }, [cart]);

  // Toast Helper
  const showToast = (message, type = 'info', duration = 3500) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.id ? null : prev));
    }, duration);
  };

  // Navigation Helpers
  const navigate = (page, params = {}) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const newRoute = { page, params };
    setHistoryStack(prev => [...prev, newRoute]);
    setCurrentRoute(newRoute);

    try {
      const targetPath = pageToPath[page] || '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    } catch (err) {
      console.warn('History pushState error:', err);
    }
  };

  const goBack = () => {
    if (historyStack.length > 1) {
      const newStack = [...historyStack];
      newStack.pop(); // Remove current
      const previous = newStack[newStack.length - 1];
      setHistoryStack(newStack);
      setCurrentRoute(previous);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        const targetPath = pageToPath[previous.page] || '/';
        window.history.pushState(null, '', targetPath);
      } catch (err) {}
    } else {
      navigate('home');
    }
  };

  // Authoritative Browser Geolocation Handler
  const requestBrowserGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'warning');
      return;
    }

    setIsLocatingGps(true);
    showToast('Requesting GPS location for 7 KM delivery verification...', 'info', 2000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = {
          id: `loc-gps-${Date.now()}`,
          name: 'Current GPS Location',
          locality: 'Detected Coordinates',
          city: 'Hailakandi',
          state: 'Assam',
          pincode: '788151',
          label: `GPS: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E (Hailakandi)`,
          latitude,
          longitude,
          isExactGps: true
        };

        api.setSelectedLocation(newLocation);
        setSelectedLocationState(newLocation);
        setIsLocatingGps(false);
        setIsLocationModalOpen(false);
        showToast('Accurate GPS location locked! 📍 Stores within 7 KM available.', 'success');
      },
      (error) => {
        setIsLocatingGps(false);
        console.warn('GPS Geolocation error:', error.message);
        showToast('GPS permission not granted. Selected Hailakandi Central by default.', 'info');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Location selector handler
  const setLocation = (loc) => {
    api.setSelectedLocation(loc);
    setSelectedLocationState(loc);
    setIsLocationModalOpen(false);
    showToast(`Delivering to ${loc.label}`, 'success');
  };

  // Cart Handlers with Single-Store Enforcement (Section 18)
  const addToCart = (product, quantity = 1, selectedWeight = null) => {
    // 1. Single Store Enforcement
    if (cart.length > 0 && cart[0].storeId !== product.storeId) {
      const existingStore = cart[0].storeName || 'another store';
      const confirmReplace = window.confirm(
        `Your cart contains items from ${existingStore}.\n\nGharTak delivers one store per order to guarantee fresh, fast delivery. Replace cart with items from ${product.storeName}?`
      );

      if (confirmReplace) {
        setCart([
          {
            itemKey: `${product.id}-${selectedWeight || product.unit}`,
            id: product.id,
            name: product.name,
            price: product.price,
            pricePaise: product.pricePaise || Math.round(product.price * 100),
            originalPrice: product.originalPrice,
            unit: selectedWeight || product.unit,
            image: product.image,
            storeId: product.storeId,
            storeName: product.storeName,
            quantity
          }
        ]);
        setAppliedCoupon(null);
        showToast(`Cart replaced with ${product.name} from ${product.storeName}`, 'info');
      }
      return;
    }

    setCart(prev => {
      const itemKey = `${product.id}-${selectedWeight || product.unit}`;
      const existing = prev.find(item => item.itemKey === itemKey);

      if (existing) {
        return prev.map(item =>
          item.itemKey === itemKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prev,
          {
            itemKey,
            id: product.id,
            name: product.name,
            price: product.price,
            pricePaise: product.pricePaise || Math.round(product.price * 100),
            originalPrice: product.originalPrice,
            unit: selectedWeight || product.unit,
            image: product.image,
            storeId: product.storeId,
            storeName: product.storeName,
            quantity
          }
        ];
      }
    });

    showToast(`Added ${product.name} to cart`, 'success');
  };

  const updateQuantity = (itemKey, delta) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.itemKey === itemKey) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (itemKey) => {
    setCart(prev => prev.filter(item => item.itemKey !== itemKey));
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCouponCode = (code) => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const result = api.applyCoupon(code, subtotal);
    if (result.valid) {
      setAppliedCoupon({ code, discount: result.discount, freeDelivery: result.freeDelivery });
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'warning');
    }
    return result;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  // Authoritative Calculation of Cart Totals (Distance based + ₹7 Platform Fee)
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Compute actual distance between store and customer
  let deliveryDistanceKm = 1.4; // Default estimate
  if (cart.length > 0) {
    const primaryStore = AUTHORITATIVE_STORES.find(s => s.id === cart[0].storeId);
    if (primaryStore && selectedLocation) {
      deliveryDistanceKm = calculateDistanceKm(
        primaryStore.latitude,
        primaryStore.longitude,
        selectedLocation.latitude,
        selectedLocation.longitude
      );
    }
  }

  const baseDeliveryFee = cart.length === 0
    ? 0
    : appliedCoupon?.freeDelivery
    ? 0
    : calculateDeliveryFeePaise(deliveryDistanceKm) / 100;

  const operationalSettings = getOperationalSettings();
  const cartPlatformFee = cart.length > 0 ? operationalSettings.platformConvenienceFeePaise / 100 : 0;
  const cartDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const cartTotal = Math.max(0, cartSubtotal + baseDeliveryFee + cartPlatformFee - cartDiscount);

  // Favourites Handlers
  const toggleFavourite = (productId) => {
    const updated = api.toggleFavourite(productId);
    setFavourites(updated);
    const isNowFav = updated.includes(productId);
    showToast(isNowFav ? 'Saved to favourites ❤️' : 'Removed from favourites', 'info');
  };

  const isFavourite = (productId) => favourites.includes(productId);

  // Address Handlers
  const addAddress = async (newAddr) => {
    const updated = await api.saveAddress(newAddr);
    setAddresses(updated);
    setSelectedAddress(newAddr);
    showToast('Address saved successfully', 'success');
  };

  const deleteAddress = async (addrId) => {
    const updated = await api.deleteAddress(addrId);
    setAddresses(updated);
    if (selectedAddress?.id === addrId) {
      setSelectedAddress(updated[0] || null);
    }
    showToast('Address deleted', 'info');
  };

  // Authoritative Order Placement (Strictly Cash on Delivery)
  const placeOrder = async () => {
    if (cart.length === 0) {
      showToast('Your cart is empty', 'warning');
      return null;
    }

    const primaryStore = cart[0];
    const loc = (selectedAddress && typeof selectedAddress.latitude === 'number' && typeof selectedAddress.longitude === 'number' && selectedAddress.latitude !== 0)
      ? { ...selectedLocation, latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
      : selectedLocation;

    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number' || loc.latitude === 0 || loc.longitude === 0) {
      showToast('Please enable GPS or verify your exact doorstep coordinates before placing order', 'warning');
      setIsLocationModalOpen(true);
      return null;
    }

    const orderPayload = {
      customerProfileId: user?.id,
      storeId: primaryStore.storeId || primaryStore.id,
      storeName: primaryStore.storeName || primaryStore.name,
      items: [...cart],
      appliedCoupon,
      deliveryLocation: loc,
      deliveryAddress: selectedAddress || addresses[0],
      customerName: user?.name,
      customerPhone: user?.phone,
      idempotencyKey: `IDEM-${Date.now()}-${crypto.randomUUID()}`
    };

    try {
      const newOrder = await api.createOrder(orderPayload);
      setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
      setActiveTrackingOrderId(newOrder.id);
      clearCart();
      showToast(`Order #${newOrder.orderNumber || newOrder.id} placed! Cash on Delivery.`, 'success');
      return newOrder;
    } catch (err) {
      showToast(err.message || 'Failed to place order', 'warning');
      throw err;
    }
  };

  // Vendor Action: Accept / Prepare / Ready
  const vendorUpdateOrderStatus = async (orderId, nextStatus, reason = null) => {
    try {
      const updated = await api.updateOrderStatus(orderId, nextStatus, { vendorProfileId: user?.id, reason });
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      showToast(`Order #${orderId} marked as ${nextStatus.replace(/_/g, ' ')}`, 'success');
      return updated;
    } catch (err) {
      showToast(err.message || `Failed to update status to ${nextStatus}`, 'warning');
      throw err;
    }
  };

  // Rider Action: Claim Delivery Job
  const riderClaimDeliveryJob = async (orderId) => {
    try {
      const res = await api.claimDeliveryJob(orderId, user?.id);
      const updated = await api.getOrderById(orderId);
      setOrders(prev => prev.map(o => (o.id === orderId ? (updated || o) : o)));
      showToast('Delivery job claimed!', 'success');
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to claim delivery job', 'warning');
      throw err;
    }
  };

  // Rider Action: Progress Delivery (PICKED_UP -> OUT_FOR_DELIVERY)
  const riderAdvanceDeliveryStatus = async (orderId, nextStatus) => {
    try {
      const updated = await api.riderAdvanceDelivery(orderId, nextStatus, user?.id);
      setOrders(prev => prev.map(o => (o.id === orderId ? (updated || o) : o)));
      showToast(`Delivery status updated to ${nextStatus.replace(/_/g, ' ')}`, 'success');
      return updated;
    } catch (err) {
      showToast(err.message || `Failed to update delivery to ${nextStatus}`, 'warning');
      throw err;
    }
  };

  // Cancel Order Flow with Authoritative Inventory Restoration
  const cancelOrder = async (orderId, reason = 'Customer requested cancellation') => {
    try {
      const res = await api.cancelOrder(orderId, user?.id, reason);
      const updated = await api.getOrderById(orderId);
      setOrders(prev => prev.map(o => (o.id === orderId ? (updated || { ...o, status: 'CANCELLED' }) : o)));
      showToast('Order has been cancelled.', 'info');
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'warning');
      throw err;
    }
  };

  // Rider Action: Confirm COD Collection & Complete Delivery (V1 - OTP disabled)
  const riderCompleteDelivery = async (orderId, collectedAmount) => {
    try {
      const result = await api.riderCompleteDelivery(orderId, collectedAmount);
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: 'DELIVERED', paymentStatus: 'COLLECTED' } : o)));
      showToast(result.message || `Delivery completed! ₹${collectedAmount} COD collected.`, 'success');
      return result;
    } catch (err) {
      showToast(err.message || 'Delivery completion failed', 'warning');
      throw err;
    }
  };

  // Backward compatible OTP alias
  const riderVerifyOtpAndDeliver = async (orderId, otp, collectedAmount) => {
    return riderCompleteDelivery(orderId, collectedAmount);
  };

  // Reorder flow
  const reorder = (order) => {
    if (!order || !order.items) return;
    order.items.forEach(item => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        unit: item.unit,
        image: item.image,
        storeId: order.storeId,
        storeName: order.storeName
      }, item.quantity);
    });
    showToast(`Items from Order #${order.id} added to cart`, 'success');
    navigate('cart');
  };

  // Notification handlers
  const markNotificationRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));
  };

  const markAllNotificationsRead = async () => {
    if (user?.id) {
      await api.markAllNotificationsRead(user.id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
    showToast('All notifications marked as read', 'success');
  };

  const [isSoundMuted, setIsSoundMuted] = useState(realtimeNotificationService.getIsMuted());
  const toggleNotificationSound = () => {
    const muted = realtimeNotificationService.toggleMute();
    setIsSoundMuted(muted);
    showToast(muted ? 'Notification sounds muted' : 'Notification sounds enabled', 'info');
  };

  const unreadNotificationCount = notifications.filter(n => !n.read && !n.isRead).length;

  // Central Role-Based Auth Flow (Zero role selectors on login)
  const loginUser = async (identifier, passwordOrOtp) => {
    const res = await api.login(identifier, passwordOrOtp);
    if (res.success && res.user) {
      setUser(res.user);
      setIsAuthModalOpen(false);

      if (res.user.role === 'admin') {
        showToast('Admin Command Center Authorized', 'success');
        navigate('admin-dashboard');
      } else if (res.user.role === 'vendor') {
        showToast(`Signed in as ${res.user.name} (Partner Store)`, 'success');
        navigate('vendor-dashboard');
      } else if (res.user.role === 'rider') {
        showToast(`Signed in as ${res.user.name} (Rider Partner)`, 'success');
        navigate('rider-dashboard');
      } else {
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        if (authRedirectAction) {
          authRedirectAction();
          setAuthRedirectAction(null);
        } else {
          navigate('home');
        }
      }
      return res;
    }
    showToast('Unable to sign in. Please verify your details.', 'warning');
    return res;
  };

  const registerConsumer = async (formData) => {
    const res = await api.registerConsumer(formData);
    if (res.success && res.user) {
      setUser(res.user);
      showToast(`Welcome to GharTak, ${res.user.name}!`, 'success');
      navigate('home');
      return res;
    }
    showToast('Failed to create account. Please try again.', 'warning');
    return res;
  };

  const submitVendorApplication = async (formData) => {
    const res = await api.submitVendorApplication(formData);
    if (res.success) {
      showToast('Vendor application submitted successfully!', 'success');
    }
    return res;
  };

  const submitRiderApplication = async (formData) => {
    const res = await api.submitRiderApplication(formData);
    if (res.success) {
      showToast('Rider application submitted successfully!', 'success');
    }
    return res;
  };

  const loginAdmin = async (email, password) => {
    const res = await api.loginAdmin(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      showToast('Admin Access Authorized', 'success');
      navigate('admin-dashboard');
      return res;
    }
    showToast(res.error || 'Access Denied: Invalid Admin Credentials', 'warning');
    return res;
  };

  const logout = () => {
    api.logoutUser();
    setUser(null);
    showToast('Logged out of GharTak', 'info');
    navigate('home');
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigate,
        goBack,
        selectedLocation,
        setLocation,
        requestBrowserGps,
        isLocatingGps,
        isLocationModalOpen,
        setIsLocationModalOpen,
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartItemCount,
        deliveryDistanceKm,
        baseDeliveryFee,
        cartPlatformFee,
        cartDiscount,
        cartTotal,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        favourites,
        toggleFavourite,
        isFavourite,
        user,
        login: (phone, otp) => loginUser(phone, otp),
        loginUser,
        registerConsumer,
        submitVendorApplication,
        submitRiderApplication,
        loginAdmin,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        setAuthRedirectAction,
        addresses,
        selectedAddress,
        setSelectedAddress,
        addAddress,
        deleteAddress,
        orders,
        placeOrder,
        vendorUpdateOrderStatus,
        riderClaimDeliveryJob,
        riderAdvanceDeliveryStatus,
        riderCompleteDelivery,
        riderVerifyOtpAndDeliver,
        cancelOrder,
        reorder,
        activeTrackingOrderId,
        setActiveTrackingOrderId,
        notifications,
        isNotificationOpen,
        setIsNotificationOpen,
        markNotificationRead,
        markAllNotificationsRead,
        unreadNotificationCount,
        isSoundMuted,
        toggleNotificationSound,
        toast,
        showToast,
        searchQuery,
        setSearchQuery
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

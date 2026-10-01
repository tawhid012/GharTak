import { getOperationalSettings } from './adminSettings.js';

// Exact Haversine Distance Formula
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5; // Default safe local estimate
  const R = 6371; // Earth radius in km
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // 2 decimal precision
};

// Check if store is within customer's 7 KM radius
export const checkStoreServiceability = (store, customerCoords) => {
  const settings = getOperationalSettings();
  if (!customerCoords || !customerCoords.latitude || !customerCoords.longitude) {
    // If no coordinates yet, assume standard Hailakandi cluster coverage for browsing
    return {
      serviceable: true,
      distanceKm: 1.2,
      maxRadiusKm: settings.serviceRadiusKm
    };
  }

  const distanceKm = calculateDistanceKm(
    store.latitude,
    store.longitude,
    customerCoords.latitude,
    customerCoords.longitude
  );

  return {
    serviceable: distanceKm <= settings.serviceRadiusKm,
    distanceKm,
    maxRadiusKm: settings.serviceRadiusKm
  };
};

// Authoritative Customer Delivery Fee Calculation (First 1 KM = ₹10, Addl KM = ₹3)
export const calculateDeliveryFeePaise = (distanceKm) => {
  const settings = getOperationalSettings();
  if (distanceKm <= settings.baseDistanceKm) {
    return settings.baseDeliveryFeePaise;
  }
  const extraKm = Math.ceil(distanceKm - settings.baseDistanceKm);
  return settings.baseDeliveryFeePaise + extraKm * settings.additionalFeePaise;
};

// Authoritative Order Financial Calculator (Integer paise precision)
export const calculateAuthoritativeOrder = ({
  store,
  customerCoords,
  items,
  couponCode = null
}) => {
  const settings = getOperationalSettings();

  // 1. Authoritative Distance & Serviceability Validation
  if (
    !customerCoords ||
    typeof customerCoords.latitude !== 'number' ||
    typeof customerCoords.longitude !== 'number' ||
    customerCoords.latitude === 0 ||
    customerCoords.longitude === 0
  ) {
    throw new Error('Exact GPS delivery coordinates are required for order placement.');
  }

  const distanceKm = calculateDistanceKm(
    store.latitude,
    store.longitude,
    customerCoords.latitude,
    customerCoords.longitude
  );

  if (distanceKm > settings.serviceRadiusKm) {
    throw new Error(
      `Store is outside service radius (${distanceKm} km). GharTak delivers within ${settings.serviceRadiusKm} km.`
    );
  }

  // 2. Subtotal in paise
  const subtotalPaise = items.reduce((sum, item) => {
    const itemPricePaise = item.pricePaise || Math.round(item.price * 100);
    return sum + itemPricePaise * item.quantity;
  }, 0);

  // 3. Delivery Fee in paise (Deterministic 0-1km = ₹10, then +₹3 per additional km)
  let deliveryFeePaise = calculateDeliveryFeePaise(distanceKm);

  // 4. Convenience Fee in paise (₹7)
  const convenienceFeePaise = settings.platformConvenienceFeePaise;

  // 5. Discount in paise (Coupons disabled in V1 per release scope)
  const discountPaise = 0;

  // 6. Final Authoritative Total (COD Amount)
  const finalTotalPaise = Math.max(
    0,
    subtotalPaise + deliveryFeePaise + convenienceFeePaise - discountPaise
  );

  return {
    distanceKm,
    subtotalPaise,
    deliveryFeePaise,
    convenienceFeePaise,
    discountPaise,
    finalTotalPaise,
    codAmountPaise: finalTotalPaise,
    // Friendly rupee equivalents for UI rendering
    subtotal: subtotalPaise / 100,
    deliveryFee: deliveryFeePaise / 100,
    convenienceFee: convenienceFeePaise / 100,
    discount: discountPaise / 100,
    total: finalTotalPaise / 100,
    pricingSnapshot: {
      serviceRadiusKm: settings.serviceRadiusKm,
      baseDistanceKm: settings.baseDistanceKm,
      baseDeliveryFeePaise: settings.baseDeliveryFeePaise,
      additionalFeePaise: settings.additionalFeePaise,
      platformConvenienceFeePaise: settings.platformConvenienceFeePaise,
      vendorCommissionPercent: settings.vendorCommissionPercent ?? 0.0,
      riderBaseEarningPaise: settings.riderBaseEarningPaise ?? 1000,
      riderPerDeliveryEarningPaise: settings.riderPerDeliveryEarningPaise ?? 300
    }
  };
};

// ============================================================================
// GHARTAK OPERATIONAL SETTINGS SERVICE
// Authoritative Admin Configuration synced with Supabase admin_settings table
// Cluster 01: Hailakandi, Assam, India
// ============================================================================

import { supabase } from '../lib/supabase.js';

export const DEFAULT_OPERATIONAL_SETTINGS = {
  serviceRadiusKm: 7.0, // Strict 7 KM cutoff
  baseDistanceKm: 1.0,  // Base 1 KM
  baseDeliveryFeePaise: 1000, // ₹10
  additionalDistanceUnitKm: 1.0,
  additionalFeePaise: 300, // ₹3 per additional KM
  platformConvenienceFeePaise: 700, // ₹7 Platform Convenience Fee
  riderBaseEarningPaise: 1000, // ₹10 fixed amount
  riderPerDeliveryEarningPaise: 300, // ₹3 per completed delivery (Total default = ₹13)
  vendorCommissionPercent: 0.0, // Default 0% unless explicitly configured by Admin
  codMaxLimitPaise: 500000, // ₹5000 max for Cash on Delivery
  minOrderAmountPaise: 5000 // ₹50 minimum order
};

let cachedSettings = { ...DEFAULT_OPERATIONAL_SETTINGS };
let hasFetchedFromDb = false;

// Synchronous getter for UI calculations
export const getOperationalSettings = () => {
  if (!hasFetchedFromDb) {
    // Trigger background fetch once
    fetchOperationalSettingsFromDb();
  }
  return { ...cachedSettings };
};

// Async fetch from Supabase admin_settings table
export const fetchOperationalSettingsFromDb = async () => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (!error && data) {
      cachedSettings = {
        serviceRadiusKm: Number(data.service_radius_km) || DEFAULT_OPERATIONAL_SETTINGS.serviceRadiusKm,
        baseDistanceKm: Number(data.base_distance_km) || DEFAULT_OPERATIONAL_SETTINGS.baseDistanceKm,
        baseDeliveryFeePaise: Number(data.base_delivery_fee_paise) || DEFAULT_OPERATIONAL_SETTINGS.baseDeliveryFeePaise,
        additionalDistanceUnitKm: Number(data.additional_distance_unit_km) || DEFAULT_OPERATIONAL_SETTINGS.additionalDistanceUnitKm,
        additionalFeePaise: Number(data.additional_fee_paise) || DEFAULT_OPERATIONAL_SETTINGS.additionalFeePaise,
        platformConvenienceFeePaise: Number(data.platform_convenience_fee_paise) || DEFAULT_OPERATIONAL_SETTINGS.platformConvenienceFeePaise,
        riderBaseEarningPaise: Number(data.rider_base_earning_paise) || DEFAULT_OPERATIONAL_SETTINGS.riderBaseEarningPaise,
        riderPerDeliveryEarningPaise: Number(data.rider_per_delivery_earning_paise) || DEFAULT_OPERATIONAL_SETTINGS.riderPerDeliveryEarningPaise,
        vendorCommissionPercent: Number(data.vendor_commission_percent) ?? DEFAULT_OPERATIONAL_SETTINGS.vendorCommissionPercent,
        codMaxLimitPaise: Number(data.cod_max_limit_paise) || DEFAULT_OPERATIONAL_SETTINGS.codMaxLimitPaise,
        minOrderAmountPaise: Number(data.min_order_amount_paise) || DEFAULT_OPERATIONAL_SETTINGS.minOrderAmountPaise
      };
      hasFetchedFromDb = true;
    }
  } catch (err) {
    console.warn('Unable to load admin settings from database, using defaults:', err);
  }
  return { ...cachedSettings };
};

// Authoritative settings update (updates memory cache immediately and persists to Supabase admin_settings)
export const updateOperationalSettings = (newSettings) => {
  cachedSettings = { ...cachedSettings, ...newSettings };

  try {
    const dbPayload = {
      service_radius_km: cachedSettings.serviceRadiusKm,
      base_distance_km: cachedSettings.baseDistanceKm,
      base_delivery_fee_paise: cachedSettings.baseDeliveryFeePaise,
      additional_distance_unit_km: cachedSettings.additionalDistanceUnitKm,
      additional_fee_paise: cachedSettings.additionalFeePaise,
      platform_convenience_fee_paise: cachedSettings.platformConvenienceFeePaise,
      rider_base_earning_paise: cachedSettings.riderBaseEarningPaise,
      rider_per_delivery_earning_paise: cachedSettings.riderPerDeliveryEarningPaise,
      vendor_commission_percent: cachedSettings.vendorCommissionPercent,
      cod_max_limit_paise: cachedSettings.codMaxLimitPaise,
      min_order_amount_paise: cachedSettings.minOrderAmountPaise,
      updated_at: new Date().toISOString()
    };

    supabase
      .from('admin_settings')
      .update(dbPayload)
      .eq('id', 'default')
      .then(({ error }) => {
        if (error) console.warn('Failed to persist admin settings to Supabase:', error.message);
      })
      .catch(err => console.warn('Error saving operational settings to database:', err));
  } catch (err) {
    console.warn('Error queuing operational settings to database:', err);
  }

  return { ...cachedSettings };
};

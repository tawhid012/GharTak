-- ============================================================================
-- GHARTAK HYPERLOCAL COMMERCE PLATFORM - PRODUCTION DATABASE SCHEMA & LOGIC
-- Cluster 01: Hailakandi, Assam, India
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'consumer' CHECK (role IN ('consumer', 'vendor', 'rider', 'admin')),
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON public.profiles(auth_user_id);

-- 2. CONSUMER ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Home',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    line1 TEXT NOT NULL,
    locality TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Hailakandi',
    state TEXT NOT NULL DEFAULT 'Assam',
    pincode TEXT NOT NULL DEFAULT '788151',
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_addresses_profile ON public.addresses(profile_id);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT,
    icon TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. STORES / VENDORS
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tagline TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    locality TEXT NOT NULL DEFAULT 'Station Road',
    city TEXT NOT NULL DEFAULT 'Hailakandi',
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    category TEXT NOT NULL,
    opening_hours TEXT NOT NULL DEFAULT '08:00 AM',
    closing_hours TEXT NOT NULL DEFAULT '09:30 PM',
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.8,
    delivery_time_min INT NOT NULL DEFAULT 15,
    delivery_time_max INT NOT NULL DEFAULT 25,
    image_url TEXT,
    banner_url TEXT,
    is_open BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    verification_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (verification_status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(verification_status, is_active, is_open);
CREATE INDEX IF NOT EXISTS idx_stores_location ON public.stores(latitude, longitude);

-- 5. PRODUCTS & INVENTORY
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_paise INT NOT NULL CHECK (price_paise > 0),
    original_price_paise INT CHECK (original_price_paise >= price_paise OR original_price_paise IS NULL),
    unit TEXT NOT NULL DEFAULT '1 pc',
    image_url TEXT,
    sku TEXT,
    stock_quantity INT NOT NULL DEFAULT 100 CHECK (stock_quantity >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.8,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_availability ON public.products(is_available, stock_quantity);

-- 6. ADMIN OPERATIONAL SETTINGS
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    service_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 7.00,
    base_distance_km NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    base_delivery_fee_paise INT NOT NULL DEFAULT 1000, -- ₹10
    additional_distance_unit_km NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    additional_fee_paise INT NOT NULL DEFAULT 300, -- ₹3 per additional km
    platform_convenience_fee_paise INT NOT NULL DEFAULT 700, -- ₹7
    rider_base_earning_paise INT NOT NULL DEFAULT 1000, -- ₹10 for first km
    rider_per_delivery_earning_paise INT NOT NULL DEFAULT 300, -- ₹3 per delivery
    vendor_commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    min_order_amount_paise INT NOT NULL DEFAULT 5000, -- ₹50
    cod_max_limit_paise INT NOT NULL DEFAULT 500000, -- ₹5000
    otp_expiry_minutes INT NOT NULL DEFAULT 180,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Insert default settings if not exists
INSERT INTO public.admin_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- 7. ORDERS & FINANCIAL SNAPSHOTS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_profile_id UUID NOT NULL REFERENCES public.profiles(id),
    store_id UUID NOT NULL REFERENCES public.stores(id),
    rider_profile_id UUID REFERENCES public.profiles(id),

    -- Geographic & Distance Snapshot
    customer_latitude NUMERIC(10, 7) NOT NULL,
    customer_longitude NUMERIC(10, 7) NOT NULL,
    store_latitude NUMERIC(10, 7) NOT NULL,
    store_longitude NUMERIC(10, 7) NOT NULL,
    delivery_distance_km NUMERIC(6, 2) NOT NULL,
    delivery_address JSONB NOT NULL,

    -- Financial Authoritative Snapshot (in paise)
    subtotal_paise INT NOT NULL,
    delivery_fee_paise INT NOT NULL,
    convenience_fee_paise INT NOT NULL,
    discount_paise INT NOT NULL DEFAULT 0,
    final_total_paise INT NOT NULL,
    cod_amount_paise INT NOT NULL,

    -- Immutable snapshot of settings at time of placement
    pricing_snapshot JSONB NOT NULL,

    -- Order Status & Payment
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP',
        'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY',
        'DELIVERED', 'CANCELLED', 'FAILED'
    )),
    payment_method TEXT NOT NULL DEFAULT 'COD',
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COLLECTED', 'REFUNDED', 'FAILED')),
    collected_amount_paise INT DEFAULT 0,

    -- Delivery OTP Security
    delivery_otp TEXT NOT NULL,
    otp_verified_at TIMESTAMPTZ,

    -- Audit & Idempotency
    idempotency_key TEXT UNIQUE,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES public.profiles(id),
    cancelled_at TIMESTAMPTZ,
    customer_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider ON public.orders(rider_profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 8. ORDER ITEMS (Immutable Snapshot)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price_paise INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price_paise INT NOT NULL,
    unit TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 9. ORDER STATUS AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    role TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_status_history_order ON public.order_status_history(order_id);

-- 10. DELIVERY JOBS
CREATE TABLE IF NOT EXISTS public.delivery_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id),
    rider_profile_id UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'ASSIGNED', 'ARRIVED_AT_STORE', 'PICKED_UP',
        'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'DELIVERED', 'CANCELLED', 'FAILED'
    )),
    pickup_latitude NUMERIC(10, 7) NOT NULL,
    pickup_longitude NUMERIC(10, 7) NOT NULL,
    drop_latitude NUMERIC(10, 7) NOT NULL,
    drop_longitude NUMERIC(10, 7) NOT NULL,
    distance_km NUMERIC(6, 2) NOT NULL,
    assigned_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_delivery_jobs_rider ON public.delivery_jobs(rider_profile_id, status);

-- 11. RIDER EARNINGS (Individual per-delivery earning records)
CREATE TABLE IF NOT EXISTS public.rider_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    rider_profile_id UUID NOT NULL REFERENCES public.profiles(id),
    delivery_job_id UUID REFERENCES public.delivery_jobs(id),
    distance_km NUMERIC(6, 2) NOT NULL,
    base_amount_paise INT NOT NULL, -- Configured first-km earning (e.g. ₹10)
    per_delivery_amount_paise INT NOT NULL, -- Configured delivery incentive (e.g. ₹3)
    total_earning_paise INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'EARNED' CHECK (status IN ('EARNED', 'SETTLED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rider_earnings_rider ON public.rider_earnings(rider_profile_id, status);

-- 12. RIDER CASH REMITTANCE LEDGER (Tracks physical COD collected cash)
CREATE TABLE IF NOT EXISTS public.rider_cash_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_profile_id UUID NOT NULL REFERENCES public.profiles(id),
    order_id UUID REFERENCES public.orders(id),
    amount_collected_paise INT NOT NULL,
    amount_remitted_paise INT NOT NULL DEFAULT 0,
    remittance_status TEXT NOT NULL DEFAULT 'HELD' CHECK (remittance_status IN ('HELD', 'PARTIALLY_REMITTED', 'REMITTED')),
    remittance_reference TEXT,
    remittance_method TEXT,
    remitted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rider_cash_rider ON public.rider_cash_ledger(rider_profile_id, remittance_status);

-- 13. SETTLEMENT PAYOUTS (Vendor & Rider Settlements by Admin)
CREATE TABLE IF NOT EXISTS public.settlement_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('VENDOR', 'RIDER')),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id),
    store_id UUID REFERENCES public.stores(id),
    total_earned_paise INT NOT NULL,
    amount_paid_paise INT NOT NULL,
    remaining_balance_paise INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'ONLINE', 'BANK_TRANSFER', 'UPI', 'OTHER')),
    payment_reference TEXT NOT NULL,
    notes TEXT,
    settled_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_settlements_recipient ON public.settlement_payouts(recipient_type, recipient_id);

-- 14. AUDITABLE FINANCIAL LEDGER
CREATE TABLE IF NOT EXISTS public.financial_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('CUSTOMER', 'VENDOR', 'RIDER', 'PLATFORM')),
    entity_id UUID,
    order_id UUID REFERENCES public.orders(id),
    amount_paise INT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'ORDER_CREATED', 'COD_COLLECTED', 'RIDER_EARNING',
        'VENDOR_PAYABLE', 'VENDOR_PAYMENT', 'RIDER_PAYMENT',
        'COD_DEPOSIT', 'REFUND', 'ADJUSTMENT'
    )),
    payment_method TEXT,
    reference TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ledger_entity ON public.financial_ledger(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ledger_order ON public.financial_ledger(order_id);

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    role TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 16. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'order',
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- ============================================================================
-- HAVERSINE DISTANCE FUNCTION (Kilometers)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_distance_haversine(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    r NUMERIC := 6371.0; -- Earth radius in KM
    dlat NUMERIC;
    dlon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat / 2.0)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2.0)^2;
    c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    RETURN ROUND((r * c)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- AUTHORITATIVE ORDER CALCULATION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_order_pricing(
    p_store_id UUID,
    p_cust_lat NUMERIC,
    p_cust_lon NUMERIC,
    p_items JSONB,
    p_coupon_code TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_store public.stores%ROWTYPE;
    v_settings public.admin_settings%ROWTYPE;
    v_distance NUMERIC;
    v_subtotal_paise INT := 0;
    v_delivery_fee_paise INT := 0;
    v_convenience_fee_paise INT := 0;
    v_discount_paise INT := 0;
    v_final_total_paise INT := 0;
    v_item JSONB;
    v_prod public.products%ROWTYPE;
    v_qty INT;
    v_extra_km NUMERIC;
BEGIN
    -- 1. Fetch store
    SELECT * INTO v_store FROM public.stores WHERE id = p_store_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Store not found';
    END IF;

    IF NOT v_store.is_active OR NOT v_store.is_open THEN
        RAISE EXCEPTION 'Store is currently closed or inactive';
    END IF;

    -- 2. Fetch admin settings
    SELECT * INTO v_settings FROM public.admin_settings WHERE id = 'default';

    -- 3. Calculate Distance
    v_distance := public.calculate_distance_haversine(v_store.latitude, v_store.longitude, p_cust_lat, p_cust_lon);

    -- 4. Validate Serviceability (7 KM Cutoff)
    IF v_distance > v_settings.service_radius_km THEN
        RAISE EXCEPTION 'Store is outside service radius (Distance: % km, Limit: % km)', v_distance, v_settings.service_radius_km;
    END IF;

    -- 5. Calculate Subtotal from authoritative products table
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO v_prod FROM public.products WHERE id = (v_item->>'id')::UUID AND store_id = p_store_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found in selected store', v_item->>'name';
        END IF;

        IF NOT v_prod.is_available THEN
            RAISE EXCEPTION 'Product % is currently unavailable', v_prod.name;
        END IF;

        v_qty := (v_item->>'quantity')::INT;
        IF v_qty > v_prod.stock_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for %. Available: %, Requested: %', v_prod.name, v_prod.stock_quantity, v_qty;
        END IF;

        v_subtotal_paise := v_subtotal_paise + (v_prod.price_paise * v_qty);
    END LOOP;

    -- 6. Delivery Fee Calculation (Base 1km = ₹10, Addl km = ₹3)
    IF v_distance <= v_settings.base_distance_km THEN
        v_delivery_fee_paise := v_settings.base_delivery_fee_paise;
    ELSE
        v_extra_km := ceil(v_distance - v_settings.base_distance_km);
        v_delivery_fee_paise := v_settings.base_delivery_fee_paise + (v_extra_km::INT * v_settings.additional_fee_paise);
    END IF;

    -- 7. Platform Convenience Fee (₹7)
    v_convenience_fee_paise := v_settings.platform_convenience_fee_paise;

    -- 8. Coupons
    IF p_coupon_code = 'GHARTAK50' AND v_subtotal_paise >= 19900 THEN
        v_discount_paise := 5000; -- ₹50
    ELSIF p_coupon_code = 'FIRSTFREE' THEN
        v_discount_paise := v_delivery_fee_paise;
    END IF;

    v_final_total_paise := GREATEST(0, v_subtotal_paise + v_delivery_fee_paise + v_convenience_fee_paise - v_discount_paise);

    RETURN jsonb_build_object(
        'store_id', v_store.id,
        'distance_km', v_distance,
        'subtotal_paise', v_subtotal_paise,
        'delivery_fee_paise', v_delivery_fee_paise,
        'convenience_fee_paise', v_convenience_fee_paise,
        'discount_paise', v_discount_paise,
        'final_total_paise', v_final_total_paise,
        'cod_amount_paise', v_final_total_paise,
        'serviceable', true,
        'pricing_snapshot', jsonb_build_object(
            'service_radius_km', v_settings.service_radius_km,
            'base_distance_km', v_settings.base_distance_km,
            'base_delivery_fee_paise', v_settings.base_delivery_fee_paise,
            'additional_fee_paise', v_settings.additional_fee_paise,
            'platform_convenience_fee_paise', v_settings.platform_convenience_fee_paise
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- IDEMPOTENT ORDER CREATION RPC (WITH INVENTORY DEDUCTION & AUDIT)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_order_rpc(
    p_customer_profile_id UUID,
    p_store_id UUID,
    p_items JSONB,
    p_cust_lat NUMERIC,
    p_cust_lon NUMERIC,
    p_delivery_address JSONB,
    p_coupon_code TEXT DEFAULT NULL,
    p_customer_notes TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_pricing JSONB;
    v_order_id UUID;
    v_order_num TEXT;
    v_otp TEXT;
    v_item JSONB;
    v_prod public.products%ROWTYPE;
    v_qty INT;
    v_existing_order public.orders%ROWTYPE;
BEGIN
    -- Check idempotency
    IF p_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_existing_order FROM public.orders WHERE idempotency_key = p_idempotency_key;
        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_existing_order.id,
                'order_number', v_existing_order.order_number,
                'is_idempotent_replay', true
            );
        END IF;
    END IF;

    -- 1. Calculate and Authoritatively Validate Order
    v_pricing := public.calculate_order_pricing(p_store_id, p_cust_lat, p_cust_lon, p_items, p_coupon_code);

    -- 2. Deduct Inventory Safely with Row Locking
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := (v_item->>'quantity')::INT;
        UPDATE public.products
        SET stock_quantity = stock_quantity - v_qty,
            updated_at = now()
        WHERE id = (v_item->>'id')::UUID AND stock_quantity >= v_qty;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Concurrency conflict: Stock changed for product %', v_item->>'name';
        END IF;
    END LOOP;

    -- 3. Generate Order Number & Secure 4-Digit Delivery OTP
    v_order_num := 'GT' || floor(100000 + random() * 900000)::TEXT;
    v_otp := lpad(floor(random() * 10000)::TEXT, 4, '0');

    -- 4. Insert Order
    INSERT INTO public.orders (
        order_number,
        customer_profile_id,
        store_id,
        customer_latitude,
        customer_longitude,
        store_latitude,
        store_longitude,
        delivery_distance_km,
        delivery_address,
        subtotal_paise,
        delivery_fee_paise,
        convenience_fee_paise,
        discount_paise,
        final_total_paise,
        cod_amount_paise,
        pricing_snapshot,
        status,
        payment_method,
        payment_status,
        delivery_otp,
        idempotency_key,
        customer_notes
    ) VALUES (
        v_order_num,
        p_customer_profile_id,
        p_store_id,
        p_cust_lat,
        p_cust_lon,
        (SELECT latitude FROM public.stores WHERE id = p_store_id),
        (SELECT longitude FROM public.stores WHERE id = p_store_id),
        (v_pricing->>'distance_km')::NUMERIC,
        p_delivery_address,
        (v_pricing->>'subtotal_paise')::INT,
        (v_pricing->>'delivery_fee_paise')::INT,
        (v_pricing->>'convenience_fee_paise')::INT,
        (v_pricing->>'discount_paise')::INT,
        (v_pricing->>'final_total_paise')::INT,
        (v_pricing->>'cod_amount_paise')::INT,
        v_pricing->'pricing_snapshot',
        'PENDING',
        'COD',
        'PENDING',
        v_otp,
        p_idempotency_key,
        p_customer_notes
    ) RETURNING id INTO v_order_id;

    -- 5. Insert Order Items Snapshot
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO v_prod FROM public.products WHERE id = (v_item->>'id')::UUID;
        v_qty := (v_item->>'quantity')::INT;
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            unit_price_paise,
            quantity,
            total_price_paise,
            unit,
            image_url
        ) VALUES (
            v_order_id,
            v_prod.id,
            v_prod.name,
            v_prod.price_paise,
            v_qty,
            v_prod.price_paise * v_qty,
            v_prod.unit,
            v_prod.image_url
        );
    END LOOP;

    -- 6. Insert Order Status History
    INSERT INTO public.order_status_history (
        order_id,
        old_status,
        new_status,
        changed_by,
        role,
        reason
    ) VALUES (
        v_order_id,
        NULL,
        'PENDING',
        p_customer_profile_id,
        'consumer',
        'Order placed by customer (Cash on Delivery)'
    );

    -- 7. Create Corresponding Delivery Job
    INSERT INTO public.delivery_jobs (
        order_id,
        store_id,
        pickup_latitude,
        pickup_longitude,
        drop_latitude,
        drop_longitude,
        distance_km,
        status
    ) VALUES (
        v_order_id,
        p_store_id,
        (SELECT latitude FROM public.stores WHERE id = p_store_id),
        (SELECT longitude FROM public.stores WHERE id = p_store_id),
        p_cust_lat,
        p_cust_lon,
        (v_pricing->>'distance_km')::NUMERIC,
        'PENDING'
    );

    -- 8. Customer Notification
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        order_id
    ) VALUES (
        p_customer_profile_id,
        'Order #' || v_order_num || ' Placed! 🚀',
        'Your order for ₹' || ((v_pricing->>'final_total_paise')::NUMERIC / 100)::TEXT || ' is placed. Cash on Delivery.',
        'order',
        v_order_id
    );

    -- 9. Financial Ledger Event
    INSERT INTO public.financial_ledger (
        entity_type,
        entity_id,
        order_id,
        amount_paise,
        direction,
        transaction_type,
        payment_method,
        notes,
        created_by
    ) VALUES (
        'CUSTOMER',
        p_customer_profile_id,
        v_order_id,
        (v_pricing->>'final_total_paise')::INT,
        'DEBIT',
        'ORDER_CREATED',
        'COD',
        'Order created with Cash on Delivery',
        p_customer_profile_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_num,
        'delivery_otp', v_otp,
        'final_total_paise', (v_pricing->>'final_total_paise')::INT,
        'distance_km', (v_pricing->>'distance_km')::NUMERIC
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VENDOR ORDER WORKFLOW RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.vendor_update_order_status(
    p_order_id UUID,
    p_next_status TEXT,
    p_vendor_profile_id UUID,
    p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_order public.orders%ROWTYPE;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Validate state transitions
    IF p_next_status = 'CONFIRMED' AND v_order.status != 'PENDING' THEN
        RAISE EXCEPTION 'Can only confirm PENDING orders';
    ELSIF p_next_status = 'PREPARING' AND v_order.status != 'CONFIRMED' THEN
        RAISE EXCEPTION 'Order must be CONFIRMED before PREPARING';
    ELSIF p_next_status = 'READY_FOR_PICKUP' AND v_order.status != 'PREPARING' THEN
        RAISE EXCEPTION 'Order must be PREPARING before READY_FOR_PICKUP';
    ELSIF p_next_status = 'CANCELLED' AND v_order.status IN ('OUT_FOR_DELIVERY', 'DELIVERED') THEN
        RAISE EXCEPTION 'Cannot cancel order once out for delivery or delivered';
    END IF;

    UPDATE public.orders
    SET status = p_next_status,
        updated_at = now()
    WHERE id = p_order_id;

    INSERT INTO public.order_status_history (
        order_id,
        old_status,
        new_status,
        changed_by,
        role,
        reason
    ) VALUES (
        p_order_id,
        v_order.status,
        p_next_status,
        p_vendor_profile_id,
        'vendor',
        p_reason
    );

    -- Notify customer
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        order_id
    ) VALUES (
        v_order.customer_profile_id,
        'Order Status: ' || replace(p_next_status, '_', ' '),
        'Your order #' || v_order.order_number || ' is now ' || lower(replace(p_next_status, '_', ' ')),
        'order',
        p_order_id
    );

    RETURN jsonb_build_object('success', true, 'status', p_next_status);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RIDER OTP VERIFICATION & COD COLLECTION RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.verify_delivery_otp_and_collect_cod_rpc(
    p_order_id UUID,
    p_entered_otp TEXT,
    p_collected_amount_paise INT,
    p_rider_profile_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_settings public.admin_settings%ROWTYPE;
    v_rider_earning_paise INT;
    v_vendor_payable_paise INT;
    v_platform_commission_paise INT;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.status != 'OUT_FOR_DELIVERY' THEN
        RAISE EXCEPTION 'Order is not OUT_FOR_DELIVERY (Current: %)', v_order.status;
    END IF;

    -- Validate OTP
    IF trim(v_order.delivery_otp) != trim(p_entered_otp) THEN
        RAISE EXCEPTION 'Invalid Delivery OTP entered';
    END IF;

    -- Validate Collected COD cash
    IF p_collected_amount_paise != v_order.final_total_paise THEN
        RAISE EXCEPTION 'Collected cash amount (% paise) does not match order total (% paise)',
            p_collected_amount_paise, v_order.final_total_paise;
    END IF;

    SELECT * INTO v_settings FROM public.admin_settings WHERE id = 'default';

    -- 1. Mark Order as DELIVERED and Payment as COLLECTED
    UPDATE public.orders
    SET status = 'DELIVERED',
        payment_status = 'COLLECTED',
        collected_amount_paise = p_collected_amount_paise,
        otp_verified_at = now(),
        updated_at = now()
    WHERE id = p_order_id;

    -- 2. Update Delivery Job
    UPDATE public.delivery_jobs
    SET status = 'DELIVERED',
        delivered_at = now()
    WHERE order_id = p_order_id;

    -- 3. Calculate Rider Payout: Configured Base (₹10) + Configured Per Delivery (₹3) = ₹13
    v_rider_earning_paise := v_settings.rider_base_earning_paise + v_settings.rider_per_delivery_earning_paise;

    INSERT INTO public.rider_earnings (
        order_id,
        rider_profile_id,
        distance_km,
        base_amount_paise,
        per_delivery_amount_paise,
        total_earning_paise,
        status
    ) VALUES (
        p_order_id,
        p_rider_profile_id,
        v_order.delivery_distance_km,
        v_settings.rider_base_earning_paise,
        v_settings.rider_per_delivery_earning_paise,
        v_rider_earning_paise,
        'EARNED'
    );

    -- 4. Record Cash into Rider Cash Ledger (Cash physical possession by rider)
    INSERT INTO public.rider_cash_ledger (
        rider_profile_id,
        order_id,
        amount_collected_paise,
        amount_remitted_paise,
        remittance_status
    ) VALUES (
        p_rider_profile_id,
        p_order_id,
        p_collected_amount_paise,
        0,
        'HELD'
    );

    -- 5. Calculate Vendor Payable: Subtotal minus Platform Commission (e.g. 5%)
    v_platform_commission_paise := round(v_order.subtotal_paise * (v_settings.vendor_commission_percent / 100.0));
    v_vendor_payable_paise := v_order.subtotal_paise - v_platform_commission_paise;

    -- 6. Insert Order Status History
    INSERT INTO public.order_status_history (
        order_id,
        old_status,
        new_status,
        changed_by,
        role,
        reason
    ) VALUES (
        p_order_id,
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        p_rider_profile_id,
        'rider',
        'OTP verified and COD cash ₹' || (p_collected_amount_paise / 100)::TEXT || ' collected'
    );

    -- 7. Financial Ledger: COD Collected by Rider
    INSERT INTO public.financial_ledger (
        entity_type, entity_id, order_id, amount_paise, direction,
        transaction_type, payment_method, notes, created_by
    ) VALUES (
        'RIDER', p_rider_profile_id, p_order_id, p_collected_amount_paise, 'CREDIT',
        'COD_COLLECTED', 'CASH', 'Cash collected at customer doorstep', p_rider_profile_id
    );

    -- 8. Financial Ledger: Rider Earning Accrued
    INSERT INTO public.financial_ledger (
        entity_type, entity_id, order_id, amount_paise, direction,
        transaction_type, notes, created_by
    ) VALUES (
        'RIDER', p_rider_profile_id, p_order_id, v_rider_earning_paise, 'CREDIT',
        'RIDER_EARNING', 'Delivery payout credited', p_rider_profile_id
    );

    -- 9. Financial Ledger: Vendor Payable Accrued
    INSERT INTO public.financial_ledger (
        entity_type, entity_id, order_id, amount_paise, direction,
        transaction_type, notes, created_by
    ) VALUES (
        'VENDOR', (SELECT owner_profile_id FROM public.stores WHERE id = v_order.store_id),
        p_order_id, v_vendor_payable_paise, 'CREDIT',
        'VENDOR_PAYABLE', 'Net vendor sales payable', p_rider_profile_id
    );

    -- 10. Notify Customer
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        order_id
    ) VALUES (
        v_order.customer_profile_id,
        'Order Delivered! 🎉',
        'Order #' || v_order.order_number || ' delivered. Thank you for choosing GharTak!',
        'order',
        p_order_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'status', 'DELIVERED',
        'payment_status', 'COLLECTED',
        'rider_earning_paise', v_rider_earning_paise,
        'vendor_payable_paise', v_vendor_payable_paise
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ADMIN SETTLEMENT RPC (SUPPORTS FULL & PARTIAL PAYMENTS WITH OVERPAYMENT CHECKS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_record_settlement_payment(
    p_recipient_type TEXT,
    p_recipient_id UUID,
    p_amount_paid_paise INT,
    p_payment_method TEXT,
    p_payment_reference TEXT,
    p_notes TEXT,
    p_admin_profile_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_total_earned_paise INT := 0;
    v_total_previously_paid_paise INT := 0;
    v_outstanding_paise INT := 0;
    v_new_remaining_paise INT := 0;
    v_settlement_status TEXT;
    v_settlement_id UUID;
BEGIN
    -- 1. Calculate Total Earned according to recipient type
    IF p_recipient_type = 'RIDER' THEN
        SELECT COALESCE(SUM(total_earning_paise), 0) INTO v_total_earned_paise
        FROM public.rider_earnings
        WHERE rider_profile_id = p_recipient_id AND status = 'EARNED';
    ELSIF p_recipient_type = 'VENDOR' THEN
        SELECT COALESCE(SUM(o.subtotal_paise), 0) INTO v_total_earned_paise
        FROM public.orders o
        JOIN public.stores s ON o.store_id = s.id
        WHERE s.owner_profile_id = p_recipient_id AND o.status = 'DELIVERED';
    ELSE
        RAISE EXCEPTION 'Invalid recipient type %', p_recipient_type;
    END IF;

    -- 2. Calculate Total Previously Paid
    SELECT COALESCE(SUM(amount_paid_paise), 0) INTO v_total_previously_paid_paise
    FROM public.settlement_payouts
    WHERE recipient_type = p_recipient_type AND recipient_id = p_recipient_id;

    v_outstanding_paise := v_total_earned_paise - v_total_previously_paid_paise;

    -- 3. Prevent Overpayment
    IF p_amount_paid_paise > v_outstanding_paise THEN
        RAISE EXCEPTION 'Overpayment not allowed. Outstanding balance: % paise, Attempted: % paise',
            v_outstanding_paise, p_amount_paid_paise;
    END IF;

    v_new_remaining_paise := v_outstanding_paise - p_amount_paid_paise;
    IF v_new_remaining_paise = 0 THEN
        v_settlement_status := 'PAID';
    ELSE
        v_settlement_status := 'PARTIALLY_PAID';
    END IF;

    -- 4. Record Settlement Transaction
    INSERT INTO public.settlement_payouts (
        recipient_type,
        recipient_id,
        total_earned_paise,
        amount_paid_paise,
        remaining_balance_paise,
        status,
        payment_method,
        payment_reference,
        notes,
        settled_by
    ) VALUES (
        p_recipient_type,
        p_recipient_id,
        v_total_earned_paise,
        p_amount_paid_paise,
        v_new_remaining_paise,
        v_settlement_status,
        p_payment_method,
        p_payment_reference,
        p_notes,
        p_admin_profile_id
    ) RETURNING id INTO v_settlement_id;

    -- 5. Record Financial Ledger Transaction
    INSERT INTO public.financial_ledger (
        entity_type,
        entity_id,
        amount_paise,
        direction,
        transaction_type,
        payment_method,
        reference,
        notes,
        created_by
    ) VALUES (
        p_recipient_type,
        p_recipient_id,
        p_amount_paid_paise,
        'DEBIT',
        CASE WHEN p_recipient_type = 'RIDER' THEN 'RIDER_PAYMENT' ELSE 'VENDOR_PAYMENT' END,
        p_payment_method,
        p_payment_reference,
        p_notes,
        p_admin_profile_id
    );

    -- 6. Audit Log
    INSERT INTO public.audit_logs (
        actor_id,
        role,
        action,
        target_type,
        target_id,
        details
    ) VALUES (
        p_admin_profile_id,
        'admin',
        'RECORD_SETTLEMENT_PAYMENT',
        p_recipient_type,
        p_recipient_id::TEXT,
        jsonb_build_object(
            'amount_paid_paise', p_amount_paid_paise,
            'remaining_balance_paise', v_new_remaining_paise,
            'reference', p_payment_reference,
            'method', p_payment_method
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'settlement_id', v_settlement_id,
        'status', v_settlement_status,
        'amount_paid_paise', p_amount_paid_paise,
        'remaining_balance_paise', v_new_remaining_paise
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ADMIN RIDER CASH DEPOSIT / REMITTANCE RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_record_rider_cash_remittance(
    p_rider_profile_id UUID,
    p_amount_remitted_paise INT,
    p_method TEXT,
    p_reference TEXT,
    p_notes TEXT,
    p_admin_profile_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_total_collected_paise INT := 0;
    v_total_remitted_paise INT := 0;
    v_outstanding_cash_paise INT := 0;
BEGIN
    SELECT COALESCE(SUM(amount_collected_paise), 0) INTO v_total_collected_paise
    FROM public.rider_cash_ledger
    WHERE rider_profile_id = p_rider_profile_id;

    SELECT COALESCE(SUM(amount_remitted_paise), 0) INTO v_total_remitted_paise
    FROM public.rider_cash_ledger
    WHERE rider_profile_id = p_rider_profile_id;

    v_outstanding_cash_paise := v_total_collected_paise - v_total_remitted_paise;

    IF p_amount_remitted_paise > v_outstanding_cash_paise THEN
        RAISE EXCEPTION 'Remittance amount (% paise) exceeds outstanding cash held (% paise)',
            p_amount_remitted_paise, v_outstanding_cash_paise;
    END IF;

    INSERT INTO public.rider_cash_ledger (
        rider_profile_id,
        amount_collected_paise,
        amount_remitted_paise,
        remittance_status,
        remittance_reference,
        remittance_method,
        remitted_at,
        notes
    ) VALUES (
        p_rider_profile_id,
        0,
        p_amount_remitted_paise,
        'REMITTED',
        p_reference,
        p_method,
        now(),
        p_notes
    );

    INSERT INTO public.financial_ledger (
        entity_type,
        entity_id,
        amount_paise,
        direction,
        transaction_type,
        payment_method,
        reference,
        notes,
        created_by
    ) VALUES (
        'RIDER',
        p_rider_profile_id,
        p_amount_remitted_paise,
        'DEBIT',
        'COD_DEPOSIT',
        p_method,
        p_reference,
        p_notes,
        p_admin_profile_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'remitted_paise', p_amount_remitted_paise,
        'remaining_outstanding_paise', v_outstanding_cash_paise - p_amount_remitted_paise
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_cash_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper to check admin role
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public / Consumer read policies
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active stores" ON public.stores FOR SELECT USING (is_active = true AND verification_status = 'ACTIVE');
CREATE POLICY "Public read available products" ON public.products FOR SELECT USING (is_available = true);
CREATE POLICY "Public read admin settings" ON public.admin_settings FOR SELECT USING (true);

-- User Profiles
CREATE POLICY "Users read own profile or admin reads all" ON public.profiles
FOR SELECT USING (auth.uid() = auth_user_id OR public.is_admin());

CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = auth_user_id);

-- Addresses
CREATE POLICY "Users manage own addresses" ON public.addresses
FOR ALL USING (
    profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
);

-- Orders
CREATE POLICY "Consumers view own orders" ON public.orders
FOR SELECT USING (
    customer_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR store_id IN (SELECT id FROM public.stores WHERE owner_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()))
    OR rider_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR public.is_admin()
);

-- Order Items
CREATE POLICY "Users view order items for accessible orders" ON public.order_items
FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders)
);

-- Delivery Jobs
CREATE POLICY "Riders and Admins view delivery jobs" ON public.delivery_jobs
FOR SELECT USING (
    rider_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR status = 'PENDING'
    OR public.is_admin()
);

-- Notifications
CREATE POLICY "Users view own notifications" ON public.notifications
FOR ALL USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
);

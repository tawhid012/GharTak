-- ============================================================================
-- GHARTAK PRODUCTION MIGRATION: REAL-TIME NOTIFICATION SYSTEM
-- Migration: 20261001000002_ghartak_realtime_notifications.sql
-- ============================================================================

-- 1. EXTEND NOTIFICATIONS TABLE SCHEMA
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS delivery_job_id UUID REFERENCES public.delivery_jobs(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS action_url TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'IMPORTANT', 'CRITICAL')),
    ADD COLUMN IF NOT EXISTS actor_role TEXT,
    ADD COLUMN IF NOT EXISTS event_key TEXT,
    ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. DUAL READ / IS_READ SYNCHRONIZATION TRIGGER
CREATE OR REPLACE FUNCTION public.sync_notification_read_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read IS DISTINCT FROM OLD.read THEN
        NEW.is_read := NEW.read;
    ELSIF NEW.is_read IS DISTINCT FROM OLD.is_read THEN
        NEW.read := NEW.is_read;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_notification_read ON public.notifications;
CREATE TRIGGER trg_sync_notification_read
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_notification_read_columns();

-- 3. UNIQUE IDEMPOTENCY / EVENT KEY INDEX (Prevents duplicate notifications)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_event_key_user
    ON public.notifications (user_id, event_key)
    WHERE event_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_priority
    ON public.notifications (priority, created_at DESC);

-- 4. ENABLE SUPABASE REALTIME REPLICATION FOR NOTIFICATIONS & OPERATIONAL TABLES
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_jobs;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 5. NOTIFICATION ROW LEVEL SECURITY POLICIES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications
FOR SELECT USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR user_id = auth.uid()
    OR public.is_admin()
    OR auth.role() = 'anon'
);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
FOR UPDATE USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR user_id = auth.uid()
    OR public.is_admin()
    OR auth.role() = 'anon'
) WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR user_id = auth.uid()
    OR public.is_admin()
    OR auth.role() = 'anon'
);

DROP POLICY IF EXISTS "System insert notifications" ON public.notifications;
CREATE POLICY "System insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- 6. AUTHORITATIVE SERVER-SIDE NOTIFICATION TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION public.create_authoritative_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_order_id UUID DEFAULT NULL,
    p_delivery_job_id UUID DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_priority TEXT DEFAULT 'NORMAL',
    p_actor_role TEXT DEFAULT NULL,
    p_event_key TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id, type, title, message, order_id, delivery_job_id,
        action_url, metadata, priority, actor_role, event_key, is_read, read
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_order_id, p_delivery_job_id,
        p_action_url, p_metadata, p_priority, p_actor_role, p_event_key, false, false
    )
    ON CONFLICT (user_id, event_key) WHERE event_key IS NOT NULL
    DO NOTHING
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ORDER EVENT NOTIFICATION TRIGGER
CREATE OR REPLACE FUNCTION public.trg_fn_order_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_vendor_profile_id UUID;
    v_admin_profile_id UUID;
    v_store_name TEXT;
    v_order_num TEXT;
BEGIN
    -- Look up vendor owner and store name
    SELECT owner_profile_id, name INTO v_vendor_profile_id, v_store_name
    FROM public.stores WHERE id = NEW.store_id;

    -- Look up admin profile
    SELECT id INTO v_admin_profile_id
    FROM public.profiles WHERE role = 'admin' LIMIT 1;

    v_order_num := COALESCE(NEW.order_number, substring(NEW.id::text from 1 for 8));

    -- A. NEW ORDER INSERTED
    IF TG_OP = 'INSERT' THEN
        -- Customer Notification
        PERFORM public.create_authoritative_notification(
            NEW.customer_id,
            'ORDER_PLACED',
            'Order Placed 🛍️',
            'Your order #' || v_order_num || ' for ₹' || (NEW.total_paise / 100)::text || ' has been placed at ' || COALESCE(v_store_name, 'store') || '.',
            NEW.id, NULL, '/order-tracking?orderId=' || NEW.id,
            jsonb_build_object('orderNumber', v_order_num, 'total', NEW.total_paise / 100),
            'NORMAL', 'system', 'order:' || NEW.id || ':placed:customer'
        );

        -- Vendor Notification
        IF v_vendor_profile_id IS NOT NULL THEN
            PERFORM public.create_authoritative_notification(
                v_vendor_profile_id,
                'NEW_ORDER',
                'New Order Received! 🔔',
                'New COD order #' || v_order_num || ' of ₹' || (NEW.total_paise / 100)::text || ' received.',
                NEW.id, NULL, '/vendor-dashboard',
                jsonb_build_object('orderNumber', v_order_num, 'total', NEW.total_paise / 100),
                'IMPORTANT', 'customer', 'order:' || NEW.id || ':placed:vendor'
            );
        END IF;

        -- Admin Notification
        IF v_admin_profile_id IS NOT NULL THEN
            PERFORM public.create_authoritative_notification(
                v_admin_profile_id,
                'NEW_ORDER',
                'New Platform Order',
                'Order #' || v_order_num || ' placed at ' || COALESCE(v_store_name, 'store') || ' (₹' || (NEW.total_paise / 100)::text || ').',
                NEW.id, NULL, '/admin-dashboard',
                jsonb_build_object('orderNumber', v_order_num, 'total', NEW.total_paise / 100),
                'NORMAL', 'customer', 'order:' || NEW.id || ':placed:admin'
            );
        END IF;

    -- B. ORDER STATUS UPDATED
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN

        IF NEW.status = 'CONFIRMED' THEN
            -- Customer: ORDER_CONFIRMED
            PERFORM public.create_authoritative_notification(
                NEW.customer_id, 'ORDER_CONFIRMED', 'Order Confirmed ✅',
                'Your order #' || v_order_num || ' has been confirmed by ' || COALESCE(v_store_name, 'the store') || '.',
                NEW.id, NULL, '/order-tracking?orderId=' || NEW.id,
                jsonb_build_object('orderNumber', v_order_num),
                'IMPORTANT', 'vendor', 'order:' || NEW.id || ':CONFIRMED:customer'
            );
            -- Vendor: ORDER_CONFIRMED
            IF v_vendor_profile_id IS NOT NULL THEN
                PERFORM public.create_authoritative_notification(
                    v_vendor_profile_id, 'ORDER_CONFIRMED', 'Order Accepted',
                    'You accepted order #' || v_order_num || '. Please begin preparation.',
                    NEW.id, NULL, '/vendor-dashboard',
                    jsonb_build_object('orderNumber', v_order_num),
                    'NORMAL', 'vendor', 'order:' || NEW.id || ':CONFIRMED:vendor'
                );
            END IF;

        ELSIF NEW.status = 'PREPARING' THEN
            -- Customer: ORDER_PREPARING
            PERFORM public.create_authoritative_notification(
                NEW.customer_id, 'ORDER_PREPARING', 'Preparing & Packing 📦',
                'Items for order #' || v_order_num || ' are being freshly packed by ' || COALESCE(v_store_name, 'store') || '.',
                NEW.id, NULL, '/order-tracking?orderId=' || NEW.id,
                jsonb_build_object('orderNumber', v_order_num),
                'NORMAL', 'vendor', 'order:' || NEW.id || ':PREPARING:customer'
            );

        ELSIF NEW.status = 'READY_FOR_PICKUP' THEN
            -- Customer: ORDER_READY
            PERFORM public.create_authoritative_notification(
                NEW.customer_id, 'ORDER_READY', 'Ready for Pickup 🛍️',
                'Order #' || v_order_num || ' is packed and awaiting rider dispatch.',
                NEW.id, NULL, '/order-tracking?orderId=' || NEW.id,
                jsonb_build_object('orderNumber', v_order_num),
                'NORMAL', 'vendor', 'order:' || NEW.id || ':READY_FOR_PICKUP:customer'
            );
            -- Admin: DELIVERY_READY
            IF v_admin_profile_id IS NOT NULL THEN
                PERFORM public.create_authoritative_notification(
                    v_admin_profile_id, 'DELIVERY_READY', 'Order Ready for Pickup 🚀',
                    'Order #' || v_order_num || ' is ready at ' || COALESCE(v_store_name, 'store') || '. Assign rider.',
                    NEW.id, NULL, '/admin-dashboard',
                    jsonb_build_object('orderNumber', v_order_num),
                    'IMPORTANT', 'vendor', 'order:' || NEW.id || ':READY_FOR_PICKUP:admin'
                );
            END IF;

        ELSIF NEW.status = 'OUT_FOR_DELIVERY' THEN
            -- Customer: ORDER_OUT_FOR_DELIVERY
            PERFORM public.create_authoritative_notification(
                NEW.customer_id, 'ORDER_OUT_FOR_DELIVERY', 'Out for Delivery 🛵',
                'Your order #' || v_order_num || ' is out for delivery with rider.',
                NEW.id, NULL, '/order-tracking?orderId=' || NEW.id,
                jsonb_build_object('orderNumber', v_order_num),
                'IMPORTANT', 'rider', 'order:' || NEW.id || ':OUT_FOR_DELIVERY:customer'
            );
            -- Vendor: ORDER_PICKED_UP
            IF v_vendor_profile_id IS NOT NULL THEN
                PERFORM public.create_authoritative_notification(
                    v_vendor_profile_id, 'ORDER_PICKED_UP', 'Order Picked Up 🛵',
                    'Order #' || v_order_num || ' has been picked up by delivery fleet.',
                    NEW.id, NULL, '/vendor-dashboard',
                    jsonb_build_object('orderNumber', v_order_num),
                    'NORMAL', 'rider', 'order:' || NEW.id || ':PICKED_UP:vendor'
                );
            END IF;

        ELSIF NEW.status = 'DELIVERED' THEN
            -- Customer: ORDER_DELIVERED
            PERFORM public.create_authoritative_notification(
                NEW.customer_id, 'ORDER_DELIVERED', 'Delivered Successfully! 🎉',
                'Your order #' || v_order_num || ' was delivered. Thank you for choosing GharTak!',
                NEW.id, NULL, '/order-tracking?orderId=' || NEW.id,
                jsonb_build_object('orderNumber', v_order_num),
                'CRITICAL', 'rider', 'order:' || NEW.id || ':DELIVERED:customer'
            );
            -- Vendor: ORDER_DELIVERED
            IF v_vendor_profile_id IS NOT NULL THEN
                PERFORM public.create_authoritative_notification(
                    v_vendor_profile_id, 'ORDER_DELIVERED', 'Delivery Completed ✅',
                    'Order #' || v_order_num || ' was successfully delivered to customer.',
                    NEW.id, NULL, '/vendor-dashboard',
                    jsonb_build_object('orderNumber', v_order_num),
                    'NORMAL', 'rider', 'order:' || NEW.id || ':DELIVERED:vendor'
                );
            END IF;
            -- Admin: DELIVERY_COMPLETED
            IF v_admin_profile_id IS NOT NULL THEN
                PERFORM public.create_authoritative_notification(
                    v_admin_profile_id, 'DELIVERY_COMPLETED', 'Delivery Completed & COD Collected',
                    'Order #' || v_order_num || ' delivered. COD of ₹' || (NEW.total_paise / 100)::text || ' collected.',
                    NEW.id, NULL, '/admin-dashboard',
                    jsonb_build_object('orderNumber', v_order_num, 'codAmount', NEW.total_paise / 100),
                    'IMPORTANT', 'rider', 'order:' || NEW.id || ':DELIVERED:admin'
                );
            END IF;

        ELSIF NEW.status = 'CANCELLED' THEN
            -- Customer: ORDER_CANCELLED
            PERFORM public.create_authoritative_notification(
                NEW.customer_id, 'ORDER_CANCELLED', 'Order Cancelled ⚠️',
                'Your order #' || v_order_num || ' has been cancelled.',
                NEW.id, NULL, '/orders',
                jsonb_build_object('orderNumber', v_order_num),
                'CRITICAL', 'system', 'order:' || NEW.id || ':CANCELLED:customer'
            );
            -- Vendor: ORDER_CANCELLED
            IF v_vendor_profile_id IS NOT NULL THEN
                PERFORM public.create_authoritative_notification(
                    v_vendor_profile_id, 'ORDER_CANCELLED', 'Order Cancelled',
                    'Order #' || v_order_num || ' was cancelled.',
                    NEW.id, NULL, '/vendor-dashboard',
                    jsonb_build_object('orderNumber', v_order_num),
                    'IMPORTANT', 'system', 'order:' || NEW.id || ':CANCELLED:vendor'
                );
            END IF;
            -- Admin: ORDER_CANCELLED
            IF v_admin_profile_id IS NOT NULL THEN
                PERFORM public.create_authoritative_notification(
                    v_admin_profile_id, 'ORDER_CANCELLED', 'Order Cancelled',
                    'Order #' || v_order_num || ' was cancelled.',
                    NEW.id, NULL, '/admin-dashboard',
                    jsonb_build_object('orderNumber', v_order_num),
                    'NORMAL', 'system', 'order:' || NEW.id || ':CANCELLED:admin'
                );
            END IF;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_authoritative_notifications ON public.orders;
CREATE TRIGGER trg_order_authoritative_notifications
    AFTER INSERT OR UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_fn_order_notifications();

-- 8. DELIVERY JOB NOTIFICATION TRIGGER (Assignment & Reassignment)
CREATE OR REPLACE FUNCTION public.trg_fn_delivery_job_notifications()
RETURNS TRIGGER AS $$
DECLARE
    v_order RECORD;
    v_rider_name TEXT;
    v_order_num TEXT;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
    IF v_order.id IS NULL THEN
        RETURN NEW;
    END IF;

    v_order_num := COALESCE(v_order.order_number, substring(v_order.id::text from 1 for 8));

    -- Handle Assignment / Reassignment
    IF (TG_OP = 'INSERT' AND NEW.rider_profile_id IS NOT NULL) OR
       (TG_OP = 'UPDATE' AND NEW.rider_profile_id IS DISTINCT FROM OLD.rider_profile_id AND NEW.rider_profile_id IS NOT NULL) THEN

        SELECT full_name INTO v_rider_name FROM public.profiles WHERE id = NEW.rider_profile_id;

        -- If reassigned from old rider, notify old rider
        IF TG_OP = 'UPDATE' AND OLD.rider_profile_id IS NOT NULL AND OLD.rider_profile_id <> NEW.rider_profile_id THEN
            PERFORM public.create_authoritative_notification(
                OLD.rider_profile_id,
                'DELIVERY_REASSIGNED',
                'Delivery Reassigned ℹ️',
                'Delivery for order #' || v_order_num || ' has been reassigned to another rider.',
                NEW.order_id, NEW.id, '/rider-dashboard',
                jsonb_build_object('orderNumber', v_order_num),
                'NORMAL', 'admin', 'delivery:' || NEW.id || ':reassigned:' || OLD.rider_profile_id
            );
        END IF;

        -- Notify New Rider: DELIVERY_ASSIGNED
        PERFORM public.create_authoritative_notification(
            NEW.rider_profile_id,
            'DELIVERY_ASSIGNED',
            'New Delivery Assigned! 🛵',
            'Order #' || v_order_num || ' assigned to you. Head to store for pickup.',
            NEW.order_id, NEW.id, '/rider-dashboard',
            jsonb_build_object('orderNumber', v_order_num),
            'IMPORTANT', 'admin', 'delivery:' || NEW.id || ':assigned:' || NEW.rider_profile_id
        );

        -- Notify Customer: RIDER_ASSIGNED
        PERFORM public.create_authoritative_notification(
            v_order.customer_id,
            'RIDER_ASSIGNED',
            'Rider Assigned 🛵',
            COALESCE(v_rider_name, 'A delivery partner') || ' has been assigned to bring your order #' || v_order_num || '.',
            NEW.order_id, NEW.id, '/order-tracking?orderId=' || NEW.order_id,
            jsonb_build_object('orderNumber', v_order_num, 'riderName', v_rider_name),
            'NORMAL', 'admin', 'delivery:' || NEW.id || ':customer_rider_assigned:' || NEW.rider_profile_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_delivery_job_authoritative_notifications ON public.delivery_jobs;
CREATE TRIGGER trg_delivery_job_authoritative_notifications
    AFTER INSERT OR UPDATE OF rider_profile_id ON public.delivery_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_fn_delivery_job_notifications();

// ============================================================================
// GHARTAK AUTHENTICATION SERVICE (PRODUCTION SUPABASE AUTH)
// Secure Identity, Real Profiles & Authoritative Server-Side Role Enforcement
// Cluster 01: Hailakandi, Assam, India
// ============================================================================

import { supabase } from '../lib/supabase.js';

class AuthService {
  constructor() {
    this._currentUser = null;
    this._currentProfile = null;
    this._listeners = new Set();
  }

  // Subscribe to auth state updates
  onAuthStateChange(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notifyListeners(user, profile) {
    for (const listener of this._listeners) {
      try {
        listener(user, profile);
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    }
  }

  // Authoritative Profile Resolution from Database
  async getProfileForUser(authUser) {
    if (!authUser || !authUser.id) return null;

    try {
      // 1. Direct lookup by auth_user_id
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (profile) {
        return await this._enrichProfile(profile);
      }

      // 2. Lookup by email if profile was seeded before auth account
      if (authUser.email) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authUser.email.toLowerCase().trim())
          .maybeSingle();

        if (profileByEmail) {
          // Link profile to auth_user_id
          await supabase
            .from('profiles')
            .update({ auth_user_id: authUser.id, updated_at: new Date().toISOString() })
            .eq('id', profileByEmail.id);
          return await this._enrichProfile({ ...profileByEmail, auth_user_id: authUser.id });
        }
      }

      // 3. Auto-provision profile from auth metadata if not found
      const meta = authUser.user_metadata || {};
      const newProfile = {
        auth_user_id: authUser.id,
        full_name: meta.full_name || meta.name || authUser.email?.split('@')[0] || 'GharTak User',
        phone: meta.phone || authUser.phone || '',
        email: authUser.email || '',
        role: meta.role || 'consumer',
        status: 'ACTIVE'
      };

      const { data: created, error: insertErr } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .maybeSingle();

      if (created) {
        return await this._enrichProfile(created);
      }

      // Fallback object if insert is blocked by strict RLS
      return {
        id: authUser.id,
        auth_user_id: authUser.id,
        full_name: newProfile.full_name,
        email: newProfile.email,
        phone: newProfile.phone,
        role: newProfile.role,
        status: 'ACTIVE'
      };
    } catch (err) {
      console.warn('Error resolving user profile:', err);
      return null;
    }
  }

  // Enrich profile with Store details (for Vendors) or Fleet details (for Riders)
  async _enrichProfile(profile) {
    if (!profile) return null;

    if (profile.role === 'vendor') {
      try {
        const { data: store } = await supabase
          .from('stores')
          .select('id, name, is_active, is_open')
          .eq('owner_profile_id', profile.id)
          .maybeSingle();

        if (store) {
          profile.storeId = store.id;
          profile.storeName = store.name;
          profile.isStoreOpen = store.is_open;
        }
      } catch (e) {
        console.warn('Vendor store enrichment failed:', e);
      }
    }

    return profile;
  }

  // Get current active session and profile
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session || !session.user) {
        return { session: null, user: null, profile: null };
      }

      const profile = await this.getProfileForUser(session.user);
      this._currentUser = session.user;
      this._currentProfile = profile;

      return { session, user: session.user, profile };
    } catch (err) {
      console.warn('Session verification failed:', err);
      return { session: null, user: null, profile: null };
    }
  }

  // Real Supabase Email + Password Sign In
  async signInWithPassword(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error) {
      throw new Error(error.message || 'Invalid credentials');
    }

    const profile = await this.getProfileForUser(data.user);
    this._currentUser = data.user;
    this._currentProfile = profile;
    this._notifyListeners(data.user, profile);

    return {
      user: data.user,
      profile,
      role: profile?.role || 'consumer'
    };
  }

  // Real Supabase Sign Up
  async signUp({ email, password, full_name, phone, role = 'consumer' }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name,
          phone,
          role
        }
      }
    });

    if (error) {
      throw new Error(error.message || 'Registration failed');
    }

    // If session returned immediately (email confirmation disabled)
    let profile = null;
    if (data.user) {
      profile = await this.getProfileForUser(data.user);
      this._currentUser = data.user;
      this._currentProfile = profile;
      this._notifyListeners(data.user, profile);
    }

    return {
      user: data.user,
      session: data.session,
      profile,
      requiresEmailConfirmation: !data.session
    };
  }

  // Sign Out
  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('SignOut warning:', err);
    }
    this._currentUser = null;
    this._currentProfile = null;
    this._notifyListeners(null, null);
  }

  // Authoritative Server-Side Admin Role Verification
  async verifyAdminRole() {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();

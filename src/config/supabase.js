/**
 * Supabase Configuration
 * SRP: Centralized configuration for Supabase client
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
} else {
  console.log('[supabase] URL loaded:', supabaseUrl.substring(0, 20) + '...');
}

// Use sessionStorage when available so each tab can keep its own session.
// This prevents the "last login wins" behavior when multiple tabs use different accounts.
let storageObj = undefined;
try {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    storageObj = window.sessionStorage;
  }
} catch (e) {
  // sessionStorage access can throw in some environments; fall back to localStorage
  try { storageObj = window.localStorage; } catch (e) { storageObj = undefined; }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: storageObj
  },
  db: {
    schema: 'public'
  }
});

export default supabase;

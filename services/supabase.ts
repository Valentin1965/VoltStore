
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing credentials. Backend features will be disabled.');
}

/**
 * Robust Singleton for SupabaseClient.
 * Uses globalThis to ensure the instance survives Hot Module Replacement (HMR) 
 * and prevents the "Multiple GoTrueClient instances" warning.
 */
const getSupabaseInstance = (): SupabaseClient => {
  const global = globalThis as any;
  
  if (global.__supabaseClientInstance) {
    return global.__supabaseClientInstance;
  }

  const client = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'placeholder',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'voltstore-auth-token'
      }
    }
  );

  global.__supabaseClientInstance = client;
  return client;
};

export const supabase = getSupabaseInstance();

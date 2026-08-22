import { config } from './config.js';

let supabaseClient = null;

/**
 * Returns the Supabase client instance, creating it if necessary.
 * Returns null if the configuration is incomplete or Supabase library is not loaded.
 */
export function getSupabase() {
  if (!config.isConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    if (typeof window !== 'undefined' && window.supabase) {
      try {
        const url = config.getSupabaseUrl();
        const key = config.getSupabaseAnonKey();
        supabaseClient = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
      }
    } else {
      console.warn("Supabase library not loaded yet on window.");
    }
  }

  return supabaseClient;
}

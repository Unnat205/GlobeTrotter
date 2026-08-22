// Configuration manager for Supabase & Google Maps API
// Loads configuration from localStorage or local environment window.ENV_CONFIG

const DEFAULT_SUPABASE_URL = (typeof window !== 'undefined' && window.ENV_CONFIG?.SUPABASE_URL) || "https://jukfxajspatnwqahsvja.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.ENV_CONFIG?.SUPABASE_ANON_KEY) || "";
const DEFAULT_GOOGLE_MAPS_KEY = (typeof window !== 'undefined' && window.ENV_CONFIG?.GOOGLE_MAPS_KEY) || "";

export const config = {
  getSupabaseUrl() {
    return localStorage.getItem("GLOBETROTTER_SUPABASE_URL") || (typeof window !== 'undefined' && window.ENV_CONFIG?.SUPABASE_URL) || DEFAULT_SUPABASE_URL;
  },

  getSupabaseAnonKey() {
    return localStorage.getItem("GLOBETROTTER_SUPABASE_ANON_KEY") || (typeof window !== 'undefined' && window.ENV_CONFIG?.SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY;
  },

  getGoogleMapsKey() {
    return localStorage.getItem("GLOBETROTTER_GOOGLE_MAPS_KEY") || (typeof window !== 'undefined' && window.ENV_CONFIG?.GOOGLE_MAPS_KEY) || DEFAULT_GOOGLE_MAPS_KEY;
  },

  setGoogleMapsKey(key) {
    if (!key) return false;
    localStorage.setItem("GLOBETROTTER_GOOGLE_MAPS_KEY", key.trim());
    return true;
  },

  clearGoogleMapsKey() {
    localStorage.removeItem("GLOBETROTTER_GOOGLE_MAPS_KEY");
  },

  loadGoogleMapsSDK(callbackName = 'initGoogleMap', libraries = 'places,geometry') {
    const key = this.getGoogleMapsKey();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=${libraries}&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  },

  setCredentials(url, key) {
    if (!url || !key) return false;
    localStorage.setItem("GLOBETROTTER_SUPABASE_URL", url.trim());
    localStorage.setItem("GLOBETROTTER_SUPABASE_ANON_KEY", key.trim());
    return true;
  },

  clearCredentials() {
    localStorage.removeItem("GLOBETROTTER_SUPABASE_URL");
    localStorage.removeItem("GLOBETROTTER_SUPABASE_ANON_KEY");
  },

  isConfigured() {
    const url = this.getSupabaseUrl();
    const key = this.getSupabaseAnonKey();
    return url && url.startsWith("https://") && key && key.length > 20;
  }
};

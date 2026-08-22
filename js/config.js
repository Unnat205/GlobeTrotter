// Configuration manager for Supabase
// You can either paste your credentials below or use the settings panel in the app.

const DEFAULT_SUPABASE_URL = "https://jukfxajspatnwqahsvja.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_4Eyg_sI_xh-V9_YdkFmsDw_Ju_JM5se";
const DEFAULT_GOOGLE_MAPS_KEY = "AIzaSyDLdsmlrG6PYg5ImIhsDLL2YIZnMSP3JKU";

export const config = {
  getSupabaseUrl() {
    return localStorage.getItem("GLOBETROTTER_SUPABASE_URL") || DEFAULT_SUPABASE_URL;
  },

  getSupabaseAnonKey() {
    return localStorage.getItem("GLOBETROTTER_SUPABASE_ANON_KEY") || DEFAULT_SUPABASE_ANON_KEY;
  },

  getGoogleMapsKey() {
    return localStorage.getItem("GLOBETROTTER_GOOGLE_MAPS_KEY") || DEFAULT_GOOGLE_MAPS_KEY;
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

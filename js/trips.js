import { getSupabase } from './supabase-client.js';
import { getCurrentUser } from './auth.js';

// Helper to generate a URL-safe random slug for sharing
function generateSlug(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/(^-|-$)+/g, '');   // Trim leading/trailing hyphens
  const rand = Math.random().toString(36).substring(2, 7); // Random 5 characters
  return `${base || 'trip'}-${rand}`;
}

/**
 * Get all trips for the authenticated user.
 */
export async function getTrips() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated.");

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get a specific trip by its ID.
 */
export async function getTripById(tripId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get a public trip (read-only) by its share slug.
 */
export async function getTripBySlug(slug) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('share_slug', slug)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new trip.
 */
export async function createTrip(tripData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated.");

  const slug = generateSlug(tripData.name);
  
  const insertData = {
    user_id: user.id,
    name: tripData.name,
    start_date: tripData.start_date,
    end_date: tripData.end_date,
    description: tripData.description || '',
    cover_photo_url: tripData.cover_photo_url || `https://images.unsplash.com/featured/800x600/?travel,adventure,${encodeURIComponent(tripData.name)}`,
    is_public: !!tripData.is_public,
    share_slug: slug
  };

  const { data, error } = await supabase
    .from('trips')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing trip.
 */
export async function updateTrip(tripId, updateData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from('trips')
    .update(updateData)
    .eq('id', tripId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a trip.
 */
export async function deleteTrip(tripId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);

  if (error) throw error;
  return true;
}

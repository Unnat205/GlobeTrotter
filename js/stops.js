import { getSupabase } from './supabase-client.js';

/**
 * Get all stops for a specific trip, ordered by their order_index.
 */
export async function getStopsForTrip(tripId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from('stops')
    .select('*')
    .eq('trip_id', tripId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Create a new stop.
 */
export async function createStop(stopData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  // Get current stops to determine the next order_index
  const currentStops = await getStopsForTrip(stopData.trip_id);
  const nextOrderIndex = currentStops.length;

  const insertData = {
    trip_id: stopData.trip_id,
    city_name: stopData.city_name,
    country: stopData.country,
    start_date: stopData.start_date,
    end_date: stopData.end_date,
    budget: stopData.budget || 0.00,
    order_index: nextOrderIndex
  };

  const { data, error } = await supabase
    .from('stops')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update stop details.
 */
export async function updateStop(stopId, updateData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from('stops')
    .update(updateData)
    .eq('id', stopId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a stop and adjust the order indexes of the remaining stops.
 */
export async function deleteStop(stopId, tripId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  // Delete the stop
  const { error: deleteErr } = await supabase
    .from('stops')
    .delete()
    .eq('id', stopId);

  if (deleteErr) throw deleteErr;

  // Refresh remaining stops to clean up order index
  const remaining = await getStopsForTrip(tripId);
  const promises = remaining.map((stop, index) => {
    return supabase
      .from('stops')
      .update({ order_index: index })
      .eq('id', stop.id);
  });

  await Promise.all(promises);
  return true;
}

/**
 * Reorder stop sequences in bulk.
 * @param {string[]} orderedStopIds List of Stop IDs in their new desired order.
 */
export async function reorderStops(orderedStopIds) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const promises = orderedStopIds.map((id, index) => {
    return supabase
      .from('stops')
      .update({ order_index: index })
      .eq('id', id);
  });

  const results = await Promise.all(promises);
  for (const res of results) {
    if (res.error) throw res.error;
  }
  return true;
}

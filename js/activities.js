import { getSupabase } from './supabase-client.js';

/**
 * Get all activities for a specific stop, ordered by day_number and order_index.
 */
export async function getActivitiesForStop(stopId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('stop_id', stopId)
    .order('day_number', { ascending: true })
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Create a new activity.
 */
export async function createActivity(activityData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  // Fetch current activities for this stop & day to calculate next order_index
  const { data: dayActivities, error: countErr } = await supabase
    .from('activities')
    .select('id')
    .eq('stop_id', activityData.stop_id)
    .eq('day_number', activityData.day_number);

  if (countErr) throw countErr;
  const nextOrderIndex = dayActivities ? dayActivities.length : 0;

  const insertData = {
    stop_id: activityData.stop_id,
    day_number: activityData.day_number,
    name: activityData.name,
    category: activityData.category,
    cost: activityData.cost || 0.00,
    duration: activityData.duration || null,
    notes: activityData.notes || '',
    order_index: nextOrderIndex
  };

  const { data, error } = await supabase
    .from('activities')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update activity details.
 */
export async function updateActivity(activityId, updateData) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from('activities')
    .update(updateData)
    .eq('id', activityId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an activity.
 */
export async function deleteActivity(activityId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId);

  if (error) throw error;
  return true;
}

/**
 * Reorder activities for a specific stop and day.
 */
export async function reorderActivities(stopId, dayNumber, orderedActivityIds) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const promises = orderedActivityIds.map((id, index) => {
    return supabase
      .from('activities')
      .update({ order_index: index, day_number: dayNumber })
      .eq('id', id);
  });

  const results = await Promise.all(promises);
  for (const res of results) {
    if (res.error) throw res.error;
  }
  return true;
}

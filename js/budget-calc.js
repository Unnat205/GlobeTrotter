/**
 * Pure calculation functions for GlobeTrotter budget aggregations.
 * These are completely free of DB or DOM references for unit-testability.
 */

/**
 * Summarize cost breakdown by activity category.
 * @param {Array} activities List of activity objects { category, cost }
 * @returns {Object} Mapping of category key to cost total
 */
export function calculateCategoryBreakdown(activities = []) {
  const breakdown = {
    lodging: 0,
    food: 0,
    transport: 0,
    sightseeing: 0,
    entertainment: 0,
    other: 0
  };

  activities.forEach(activity => {
    const cat = (activity.category || 'other').toLowerCase();
    const cost = parseFloat(activity.cost) || 0;
    if (breakdown.hasOwnProperty(cat)) {
      breakdown[cat] += cost;
    } else {
      breakdown.other += cost;
    }
  });

  return breakdown;
}

/**
 * Summarize budget versus actual costs on a stop-by-stop basis.
 * @param {Array} stops List of stop objects { id, city_name, budget }
 * @param {Array} activities List of activity objects { stop_id, cost }
 * @returns {Array} List of stop summaries { stop_id, city_name, budget, actual_cost, variance }
 */
export function calculateStopCosts(stops = [], activities = []) {
  // Map stop_id to list of activities
  const activitiesByStop = {};
  activities.forEach(act => {
    if (!activitiesByStop[act.stop_id]) {
      activitiesByStop[act.stop_id] = [];
    }
    activitiesByStop[act.stop_id].push(act);
  });

  return stops.map(stop => {
    const stopActivities = activitiesByStop[stop.id] || [];
    const actualCost = stopActivities.reduce((sum, act) => sum + (parseFloat(act.cost) || 0), 0);
    const budget = parseFloat(stop.budget) || 0;
    
    return {
      stop_id: stop.id,
      city_name: stop.city_name,
      budget: budget,
      actual_cost: actualCost,
      variance: budget - actualCost
    };
  });
}

/**
 * Calculate the overall trip budget summary.
 * @param {Array} stops List of stop objects { id, budget }
 * @param {Array} activities List of activity objects { cost }
 * @returns {Object} Overall summary { total_budget, total_actual, remaining, status }
 */
export function calculateTripSummary(stops = [], activities = []) {
  const totalBudget = stops.reduce((sum, stop) => sum + (parseFloat(stop.budget) || 0), 0);
  const totalActual = activities.reduce((sum, act) => sum + (parseFloat(act.cost) || 0), 0);
  const remaining = totalBudget - totalActual;
  
  let status = 'on-budget';
  if (remaining < 0) {
    status = 'over-budget';
  } else if (remaining < totalBudget * 0.1) {
    status = 'warning'; // Less than 10% budget remaining
  }

  return {
    total_budget: totalBudget,
    total_actual: totalActual,
    remaining: remaining,
    status: status
  };
}

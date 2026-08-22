import { calculateCategoryBreakdown, calculateStopCosts, calculateTripSummary } from './js/budget-calc.js';
import assert from 'assert';

console.log("Starting GlobeTrotter budget math verification...");

try {
  // 1. Verify Category Breakdown
  const activities = [
    { category: 'lodging', cost: '150.00' },
    { category: 'food', cost: 42.50 },
    { category: 'food', cost: 17.50 },
    { category: 'transport', cost: 80.00 },
    { category: 'sightseeing', cost: 35 },
    { category: 'entertainment', cost: 120 },
    { category: 'other', cost: 15 },
    { category: 'CUSTOM_INVALID', cost: 10 } // should map to other
  ];

  const breakdown = calculateCategoryBreakdown(activities);
  assert.strictEqual(breakdown.lodging, 150);
  assert.strictEqual(breakdown.food, 60);
  assert.strictEqual(breakdown.transport, 80);
  assert.strictEqual(breakdown.sightseeing, 35);
  assert.strictEqual(breakdown.entertainment, 120);
  assert.strictEqual(breakdown.other, 25); // 15 + 10
  console.log("✓ Category breakdown calculations are correct.");

  // 2. Verify Stop Costs
  const stops = [
    { id: 'stop-paris', city_name: 'Paris', budget: '1000.00' },
    { id: 'stop-rome', city_name: 'Rome', budget: 500.00 }
  ];
  const stopActivities = [
    { stop_id: 'stop-paris', cost: 400.00 },
    { stop_id: 'stop-paris', cost: 350.00 },
    { stop_id: 'stop-rome', cost: 600.00 } // over budget
  ];

  const stopCosts = calculateStopCosts(stops, stopActivities);
  assert.strictEqual(stopCosts.length, 2);
  
  // Paris checks
  assert.strictEqual(stopCosts[0].city_name, 'Paris');
  assert.strictEqual(stopCosts[0].budget, 1000);
  assert.strictEqual(stopCosts[0].actual_cost, 750);
  assert.strictEqual(stopCosts[0].variance, 250);

  // Rome checks
  assert.strictEqual(stopCosts[1].city_name, 'Rome');
  assert.strictEqual(stopCosts[1].budget, 500);
  assert.strictEqual(stopCosts[1].actual_cost, 600);
  assert.strictEqual(stopCosts[1].variance, -100);
  console.log("✓ Stop budget vs actual variance calculations are correct.");

  // 3. Verify Trip Summary Warnings
  // Case A: Safe
  const summarySafe = calculateTripSummary(stops, stopActivities);
  assert.strictEqual(summarySafe.total_budget, 1500);
  assert.strictEqual(summarySafe.total_actual, 1350);
  assert.strictEqual(summarySafe.remaining, 150);
  // remaining (150) is exactly 10% of total budget (150). The check is remaining < totalBudget * 0.1, so 150 < 150 is false.
  // Thus it should be 'on-budget'.
  assert.strictEqual(summarySafe.status, 'on-budget');

  // Case B: Warning (less than 10% remaining)
  const warningActivities = [
    ...stopActivities,
    { stop_id: 'stop-paris', cost: 50.00 } // total spent becomes 1400, remaining is 100 (6.6%)
  ];
  const summaryWarning = calculateTripSummary(stops, warningActivities);
  assert.strictEqual(summaryWarning.status, 'warning');

  // Case C: Overbudget
  const overActivities = [
    ...stopActivities,
    { stop_id: 'stop-paris', cost: 200.00 } // total spent becomes 1550, remaining is -50
  ];
  const summaryOver = calculateTripSummary(stops, overActivities);
  assert.strictEqual(summaryOver.status, 'over-budget');

  console.log("✓ Trip status levels (on-budget, warning, over-budget) are correct.");
  console.log("SUCCESS: All math assertions verified successfully!");

} catch (err) {
  console.error("FAIL: Math assertion check failed!", err);
  process.exit(1);
}

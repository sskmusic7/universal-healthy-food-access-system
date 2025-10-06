// test-classification.js - Unit test for food outlet classification logic

console.log('🧪 Testing Food Outlet Classification Logic\n');

// Simulate the classification function from dataFetchers.js
function classifyOutlet(tags) {
  const shop = tags?.shop;
  const amenity = tags?.amenity;

  // Healthy primary
  if (['supermarket', 'greengrocer', 'farm', 'health_food'].includes(shop)) {
    return 'healthy_primary';
  }
  if (amenity === 'marketplace') return 'healthy_primary';

  // Unhealthy
  if (amenity === 'fast_food') return 'unhealthy';
  if (shop === 'alcohol') return 'unhealthy';

  // Mixed (needs validation)
  if (['grocery', 'convenience', 'butcher', 'fishmonger'].includes(shop)) {
    return 'mixed';
  }

  return 'unknown';
}

function getOutletClassification(tags) {
  const type = classifyOutlet(tags);

  const classifications = {
    healthy_primary: {
      label: 'Healthy Food Source',
      color: '#0d5e3a',
      score: 1.0
    },
    mixed: {
      label: 'Mixed Selection',
      color: '#fbbf24',
      score: 0.5
    },
    unhealthy: {
      label: 'Unhealthy',
      color: '#dc2626',
      score: 0.0
    },
    unknown: {
      label: 'Unknown',
      color: '#6b7280',
      score: 0.3
    }
  };

  return classifications[type] || classifications.unknown;
}

// Test cases
const testCases = [
  { tags: { shop: 'supermarket' }, expected: 'healthy_primary', label: 'Supermarket' },
  { tags: { shop: 'greengrocer' }, expected: 'healthy_primary', label: 'Greengrocer' },
  { tags: { shop: 'farm' }, expected: 'healthy_primary', label: 'Farm' },
  { tags: { amenity: 'marketplace' }, expected: 'healthy_primary', label: 'Marketplace' },
  { tags: { shop: 'convenience' }, expected: 'mixed', label: 'Convenience Store' },
  { tags: { shop: 'grocery' }, expected: 'mixed', label: 'Grocery Store' },
  { tags: { shop: 'butcher' }, expected: 'mixed', label: 'Butcher' },
  { tags: { amenity: 'fast_food' }, expected: 'unhealthy', label: 'Fast Food' },
  { tags: { shop: 'alcohol' }, expected: 'unhealthy', label: 'Alcohol Store' },
  { tags: { shop: 'bakery' }, expected: 'unknown', label: 'Bakery (unclassified)' }
];

let passed = 0;
let failed = 0;

console.log('Running classification tests...\n');

testCases.forEach(({ tags, expected, label }) => {
  const result = classifyOutlet(tags);
  const classification = getOutletClassification(tags);

  if (result === expected) {
    console.log(`✅ ${label}: ${result} (score: ${classification.score}, color: ${classification.color})`);
    passed++;
  } else {
    console.log(`❌ ${label}: Expected ${expected}, got ${result}`);
    failed++;
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

// Test scoring calculation
console.log('\n🎯 Testing Food Access Score Calculation\n');

function calculateFoodAccessScore(outlets) {
  if (!outlets || outlets.length === 0) return 0;

  const healthyCount = outlets.filter(o => classifyOutlet(o.tags) === 'healthy_primary').length;
  const mixedCount = outlets.filter(o => classifyOutlet(o.tags) === 'mixed').length;
  const unhealthyCount = outlets.filter(o => classifyOutlet(o.tags) === 'unhealthy').length;

  const totalCount = outlets.length;
  const healthyRatio = healthyCount / totalCount;
  const mixedRatio = mixedCount / totalCount;
  const unhealthyRatio = unhealthyCount / totalCount;

  // Weighted score: healthy=1.0, mixed=0.5, unhealthy=0.0
  const score = (healthyRatio * 1.0) + (mixedRatio * 0.5) + (unhealthyRatio * 0.0);

  return Math.round(score * 100); // 0-100%
}

// Test scenarios
const scenarios = [
  {
    name: 'Healthy Area',
    outlets: [
      { tags: { shop: 'supermarket' } },
      { tags: { shop: 'greengrocer' } },
      { tags: { shop: 'farm' } }
    ],
    expectedScore: 100
  },
  {
    name: 'Food Desert',
    outlets: [
      { tags: { amenity: 'fast_food' } },
      { tags: { amenity: 'fast_food' } },
      { tags: { shop: 'alcohol' } }
    ],
    expectedScore: 0
  },
  {
    name: 'Mixed Area',
    outlets: [
      { tags: { shop: 'supermarket' } },
      { tags: { shop: 'convenience' } },
      { tags: { amenity: 'fast_food' } }
    ],
    expectedScore: 50 // (1.0 + 0.5 + 0.0) / 3 = 0.5 = 50%
  }
];

scenarios.forEach(({ name, outlets, expectedScore }) => {
  const score = calculateFoodAccessScore(outlets);
  const match = score === expectedScore ? '✅' : '❌';
  console.log(`${match} ${name}: Score ${score}% (expected ${expectedScore}%)`);
});

console.log('\n✅ Classification logic smoke test complete!\n');

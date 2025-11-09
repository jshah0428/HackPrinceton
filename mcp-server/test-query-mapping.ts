/**
 * Simple test script to verify query mapping works correctly
 * Run with: npx tsx test-query-mapping.ts
 */

import { PlacesService } from './src/places-service.js';

// Test queries - health-focused
const testQueries = [
  'dental doctors',
  'dentists',
  'tooth pain',
  'orthodontist',
  'pharmacies',
  'prescription refill',
  'flu shot',
  'cvs pharmacy',
  'hospitals',
  'emergency room',
  'urgent care',
  'primary care doctor',
  'gp',
  'physician',
  'physical therapy',
  'blood test',
  'medical lab',
  'wellness center',
];

console.log('Testing Query Mapping\n' + '='.repeat(50) + '\n');

const placesService = new PlacesService('test-key');

testQueries.forEach(query => {
  const matchedType = placesService.mapQueryToPlaceType(query);
  console.log(`"${query}" → ${matchedType}`);
});

console.log('\n' + '='.repeat(50));
console.log('✓ Query mapping test complete!');


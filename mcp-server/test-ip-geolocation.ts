/**
 * Test script to verify IP geolocation works
 * Run with: npx tsx test-ip-geolocation.ts
 */

import { PlacesService } from './src/places-service.js';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'test-key';

console.log('🌍 Testing IP Geolocation\n');
console.log('='.repeat(60));

const placesService = new PlacesService(API_KEY);

(async () => {
  try {
    console.log('\n📍 Step 1: Getting location from IP address...\n');
    const location = await placesService.getLocationFromIP();
    
    console.log(`✓ Location detected from IP:`);
    console.log(`  Latitude: ${location.latitude}`);
    console.log(`  Longitude: ${location.longitude}`);
    
    if (API_KEY !== 'test-key') {
      console.log('\n📍 Step 2: Testing full search with IP location...\n');
      const result = await placesService.findPlaces('pharmacy', undefined, 3);
      
      console.log(`Query: "${result.originalQuery}"`);
      console.log(`Matched Type: ${result.matchedType}`);
      console.log(`Location Source: ${result.locationSource}`);
      console.log(`Location Used: ${result.locationUsed.latitude}, ${result.locationUsed.longitude}`);
      console.log(`\nFound ${result.places.length} results:\n`);
      
      result.places.forEach((place, i) => {
        console.log(`${i + 1}. ${place.name}`);
        console.log(`   ${place.address}\n`);
      });
    } else {
      console.log('\n⚠️  Skipping full search test (no API key provided)');
      console.log('   Set GOOGLE_PLACES_API_KEY in .env to test full functionality');
    }
    
    console.log('='.repeat(60));
    console.log('✅ IP geolocation test complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
})();


// Replace with your NEW API key (not the one you shared earlier!)
const API_KEY = 'AIzaSyCKEP8ibAIbOiWAwZiKhGuSMb_r-V1Q5Ig';

async function findNearbyMedical() {
  // Get current location
  if (!navigator.geolocation) {
    console.error('Geolocation not supported');
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    console.log(`Your location: ${lat}, ${lng}`);

    // Search ONLY for urgent care centers
    const urgentCare = await searchPlaces(lat, lng, 'restaurant');
    console.log('\n=== URGENT CARE CENTERS (For Flu Treatment) ===');
    if (urgentCare.length > 0) {
      urgentCare.forEach((place, i) => {
        console.log(`${i + 1}. ${place.displayName.text}`);
        console.log(`   ${place.formattedAddress}`);
      });
    } else {
      console.log('No urgent care centers found nearby. Try increasing search radius.');
    }

    // Search for pharmacies
    const pharmacies = await searchPlaces(lat, lng, 'pharmacy');
    console.log('\n=== PHARMACIES NEARBY ===');
    if (pharmacies.length > 0) {
      pharmacies.forEach((place, i) => {
        console.log(`${i + 1}. ${place.displayName.text}`);
        console.log(`   ${place.formattedAddress}`);
      });
    } else {
      console.log('No pharmacies found nearby.');
    }
  }, (error) => {
    console.error('Error getting location:', error.message);
  });
}

async function searchPlaces(lat, lng, type) {
  const requestBody = {
    includedTypes: [type],
    maxResultCount: 4,
    locationRestriction: {
      circle: {
        center: {
          latitude: lat,
          longitude: lng
        },
        radius: 10000  // 10km radius for better coverage
      }
    }
  };

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API Error for ${type}:`, response.status, response.statusText, errorData);
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.places || [];
  } catch (error) {
    console.error(`Error searching for ${type}:`, error);
    throw error; // Re-throw so the UI can handle it
  }
}

// Run the function

import Fuse from 'fuse.js';
import { PLACE_TYPES, PLACE_TYPE_SEARCH_LIST } from './place-types.js';

interface Location {
  latitude: number;
  longitude: number;
}

interface PlaceResult {
  name: string;
  address: string;
  type: string;
}

export class PlacesService {
  private apiKey: string;
  private fuse: Fuse<typeof PLACE_TYPE_SEARCH_LIST[0]>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    
    // Initialize fuzzy search with better options
    this.fuse = new Fuse(PLACE_TYPE_SEARCH_LIST, {
      keys: ['keyword', 'type'],
      threshold: 0.5, // More lenient matching
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }

  /**
   * Gets location from IP address using IP geolocation service
   * @returns Location coordinates based on IP address
   */
  public async getLocationFromIP(): Promise<Location> {
    try {
      // Option A: ipapi.co (free tier available)
      const response = await fetch('https://ipapi.co/json/');
      
      if (!response.ok) {
        throw new Error(`IP geolocation API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
        };
      }
      
      throw new Error('Invalid response from IP geolocation service');
    } catch (error) {
      // Fallback to ip-api.com if ipapi.co fails
      try {
        const response = await fetch('http://ip-api.com/json/');
        const data = await response.json();
        
        if (data.status === 'success' && data.lat && data.lon) {
          return {
            latitude: data.lat,
            longitude: data.lon,
          };
        }
      } catch (fallbackError) {
        // If both fail, throw the original error
      }
      
      throw new Error(
        `Failed to get location from IP: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Maps a user query to the closest valid Google Places API type
   * @param query - User's search query (e.g., "dental doctors", "coffee shops")
   * @returns The best matching place type
   */
  public mapQueryToPlaceType(query: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Try exact match first (type name or keyword)
    const exactMatch = PLACE_TYPES.find(pt => 
      pt.type === normalizedQuery || 
      pt.keywords.includes(normalizedQuery)
    );
    
    if (exactMatch) {
      return exactMatch.type;
    }

    // Try exact match with underscores replaced by spaces
    const withUnderscores = normalizedQuery.replace(/\s+/g, '_');
    const underscoreMatch = PLACE_TYPES.find(pt => pt.type === withUnderscores);
    if (underscoreMatch) {
      return underscoreMatch.type;
    }

    // Split into words and try to match
    const words = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
    
    // Try to find types where ALL words match keywords
    const allWordsMatch = PLACE_TYPES.find(pt =>
      words.every(word => pt.keywords.some(kw => kw.includes(word)))
    );
    if (allWordsMatch) {
      return allWordsMatch.type;
    }

    // Try to find types where most important word matches
    const importantWords = words.filter(w => 
      !['the', 'a', 'an', 'and', 'or', 'for', 'near', 'nearby'].includes(w)
    );
    
    for (const word of importantWords) {
      // Look for exact keyword match
      const keywordMatch = PLACE_TYPES.find(pt => pt.keywords.includes(word));
      if (keywordMatch) {
        return keywordMatch.type;
      }
    }

    // Use fuzzy search on full query
    const results = this.fuse.search(normalizedQuery);
    if (results.length > 0 && results[0].score && results[0].score < 0.3) {
      return results[0].item.type;
    }

    // Try fuzzy search on individual important words
    for (const word of importantWords) {
      const wordResults = this.fuse.search(word);
      if (wordResults.length > 0 && wordResults[0].score && wordResults[0].score < 0.3) {
        return wordResults[0].item.type;
      }
    }

    // Default to 'doctor' if no match found (since this is a health-focused app)
    return 'doctor';
  }

  /**
   * Searches for nearby places using Google Places API
   * @param location - User's location
   * @param placeType - Google Places API place type
   * @param maxResults - Maximum number of results to return
   * @returns Array of places
   */
  public async searchNearbyPlaces(
    location: Location,
    placeType: string,
    maxResults: number = 5
  ): Promise<PlaceResult[]> {
    const requestBody = {
      includedTypes: [placeType],
      maxResultCount: maxResults,
      locationRestriction: {
        circle: {
          center: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          radius: 10000, // 10km radius
        },
      },
    };

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const places = data.places || [];

      return places.map((place: any) => ({
        name: place.displayName?.text || 'Unknown',
        address: place.formattedAddress || 'No address available',
        type: placeType,
      }));
    } catch (error) {
      console.error('Error searching for places:', error);
      throw error;
    }
  }

  /**
   * Main method: Takes a user query and optional location, returns nearby places
   * If location is not provided, automatically detects it from IP address
   * @param query - User's search query (e.g., "dental doctors")
   * @param location - Optional user's location. If not provided, will use IP geolocation
   * @param maxResults - Maximum number of results to return
   * @returns Array of places with matched type info
   */
  public async findPlaces(
    query: string,
    location?: Location,
    maxResults: number = 5
  ): Promise<{ places: PlaceResult[]; matchedType: string; originalQuery: string; locationUsed: Location; locationSource: 'provided' | 'ip' }> {
    // If location not provided, get it from IP
    let finalLocation: Location;
    let locationSource: 'provided' | 'ip';
    
    if (location) {
      finalLocation = location;
      locationSource = 'provided';
    } else {
      finalLocation = await this.getLocationFromIP();
      locationSource = 'ip';
    }

    const matchedType = this.mapQueryToPlaceType(query);
    const places = await this.searchNearbyPlaces(finalLocation, matchedType, maxResults);

    return {
      places,
      matchedType,
      originalQuery: query,
      locationUsed: finalLocation,
      locationSource,
    };
  }
}


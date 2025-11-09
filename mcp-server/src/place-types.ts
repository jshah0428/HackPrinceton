/**
 * Valid Google Places API place types from Table A
 * Source: https://developers.google.com/maps/documentation/places/web-service/place-types
 */

export interface PlaceType {
  type: string;
  category: string;
  keywords: string[];
}

export const PLACE_TYPES: PlaceType[] = [
  // Health and Wellness - Primary medical facilities
  { type: "hospital", category: "Health", keywords: ["hospital", "emergency", "health", "medical", "center", "er"] },
  { type: "doctor", category: "Health", keywords: ["doctor", "physician", "medical", "clinic", "urgent", "care", "primary", "gp", "general", "practitioner", "checkup", "appointment"] },
  { type: "dental_clinic", category: "Health", keywords: ["dental", "clinic", "teeth", "oral", "orthodontics"] },
  { type: "dentist", category: "Health", keywords: ["dentist", "dental", "teeth", "orthodontist", "oral", "tooth", "cavity"] },
  
  // Pharmacies
  { type: "pharmacy", category: "Health", keywords: ["pharmacy", "medicine", "prescription", "chemist", "cvs", "walgreens", "rite", "aid", "drug", "medication", "pills", "flu", "shot", "vaccine", "immunization", "vaccination"] },
  { type: "drugstore", category: "Health", keywords: ["drugstore", "medicine", "medication", "drug", "store"] },
  
  // Specialized medical services
  { type: "medical_lab", category: "Health", keywords: ["medical", "lab", "laboratory", "testing", "blood", "test", "diagnostic"] },
  { type: "physiotherapist", category: "Health", keywords: ["physiotherapist", "physical", "therapy", "rehab", "rehabilitation", "pt"] },
  { type: "spa", category: "Health", keywords: ["spa", "massage", "wellness", "beauty", "relaxation", "therapeutic"] },
];

// Create a searchable list for fuzzy matching
export const PLACE_TYPE_SEARCH_LIST = PLACE_TYPES.flatMap(pt => 
  pt.keywords.map(keyword => ({
    keyword,
    type: pt.type,
    category: pt.category
  }))
);

// utils/geoHelper.js
// Location and distance utility functions for AidConnect
// Used by the matching engine to find nearby volunteers and providers
// MongoDB uses GeoJSON format: coordinates are [longitude, latitude]
// NOTE: This is opposite to what most people expect (lat, lng)
//       MongoDB always expects [lng, lat] order

// ─────────────────────────────────────────
// VALIDATE COORDINATES
// Checks if provided coordinates are valid
// longitude must be between -180 and 180
// latitude must be between -90 and 90
// Parameters:
//   longitude → number
//   latitude  → number
// Returns: boolean
// ─────────────────────────────────────────
const isValidCoordinates = (longitude, latitude) => {
  if (
    typeof longitude !== "number" ||
    typeof latitude !== "number"
  ) {
    return false;
  }

  if (longitude < -180 || longitude > 180) return false;
  if (latitude < -90 || latitude > 90) return false;

  return true;
};

// ─────────────────────────────────────────
// CREATE GEOJSON POINT
// MongoDB requires location in GeoJSON format
// This creates that format from coordinates
// Parameters:
//   longitude → number (e.g. 73.0479 for Rawalpindi)
//   latitude  → number (e.g. 33.5651 for Rawalpindi)
// Returns: GeoJSON Point object
// ─────────────────────────────────────────
const createGeoPoint = (longitude, latitude) => {
  return {
    type: "Point",
    coordinates: [longitude, latitude], // MongoDB: [lng, lat]
  };
};

// ─────────────────────────────────────────
// CALCULATE DISTANCE BETWEEN TWO POINTS
// Uses the Haversine formula
// This is the standard formula for calculating
// distance between two points on a sphere (Earth)
// Parameters:
//   coord1 → [longitude, latitude] array
//   coord2 → [longitude, latitude] array
// Returns: distance in kilometers
// ─────────────────────────────────────────
const calculateDistance = (coord1, coord2) => {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  // Earth radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in kilometers
  const distance = R * c;

  // Round to 2 decimal places
  return Math.round(distance * 100) / 100;
};

// ─────────────────────────────────────────
// HELPER: DEGREES TO RADIANS
// Used internally by calculateDistance
// ─────────────────────────────────────────
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// ─────────────────────────────────────────
// METERS TO KILOMETERS
// MongoDB geo queries use meters for radius
// Our app stores serviceRadius in kilometers
// This converts km to meters for MongoDB queries
// Parameters:
//   km → number in kilometers
// Returns: number in meters
// ─────────────────────────────────────────
const kmToMeters = (km) => {
  return km * 1000;
};

// ─────────────────────────────────────────
// BUILD GEO QUERY
// Builds the MongoDB $nearSphere query object
// Used in matching engine to find nearby volunteers
// Parameters:
//   longitude  → number
//   latitude   → number
//   radiusInKm → number (search radius in kilometers)
// Returns: MongoDB geo query object
// ─────────────────────────────────────────
const buildGeoQuery = (longitude, latitude, radiusInKm = 10) => {
  return {
    $nearSphere: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      $maxDistance: kmToMeters(radiusInKm), // MongoDB needs meters
    },
  };
};

// ─────────────────────────────────────────
// CALCULATE MATCH SCORE BASED ON DISTANCE
// Closer volunteers get higher distance scores
// Used in matching engine scoring system
// Parameters:
//   distanceKm    → actual distance in km
//   maxRadiusKm   → maximum search radius in km
// Returns: score from 0 to 100
// ─────────────────────────────────────────
const getDistanceScore = (distanceKm, maxRadiusKm = 10) => {
  if (distanceKm <= 0) return 100;
  if (distanceKm >= maxRadiusKm) return 0;

  // Linear inverse scoring
  // 0km away = 100 points, maxRadius away = 0 points
  const score = ((maxRadiusKm - distanceKm) / maxRadiusKm) * 100;

  return Math.round(score);
};

module.exports = {
  isValidCoordinates,
  createGeoPoint,
  calculateDistance,
  kmToMeters,
  buildGeoQuery,
  getDistanceScore,
};
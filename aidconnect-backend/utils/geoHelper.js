// utils/geoHelper.js
// Location and distance utility functions for AidConnect
// Used by the matching engine to find nearby volunteers and providers
// MongoDB uses GeoJSON format: coordinates are [longitude, latitude]
// NOTE: This is opposite to what most people expect (lat, lng)
//       MongoDB always expects [lng, lat] order

// ─────────────────────────────────────────
// VALIDATE COORDINATES
// ─────────────────────────────────────────
const isValidCoordinates = (longitude, latitude) => {
  if (typeof longitude !== "number" || typeof latitude !== "number") {
    return false;
  }
  if (longitude < -180 || longitude > 180) return false;
  if (latitude < -90 || latitude > 90) return false;
  return true;
};

// ─────────────────────────────────────────
// CREATE GEOJSON POINT
// ─────────────────────────────────────────
const createGeoPoint = (longitude, latitude) => {
  return {
    type: "Point",
    coordinates: [longitude, latitude],
  };
};

// ─────────────────────────────────────────
// HELPER: DEGREES TO RADIANS
// ─────────────────────────────────────────
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// ─────────────────────────────────────────
// CALCULATE DISTANCE BETWEEN TWO POINTS
// Uses Haversine formula
// ─────────────────────────────────────────
const calculateDistance = (coord1, coord2) => {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

// ─────────────────────────────────────────
// METERS TO KILOMETERS
// ─────────────────────────────────────────
const kmToMeters = (km) => {
  return km * 1000;
};

// ─────────────────────────────────────────
// BUILD GEO QUERY
// ─────────────────────────────────────────
const buildGeoQuery = (longitude, latitude, radiusInKm = 10) => {
  return {
    $nearSphere: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      $maxDistance: kmToMeters(radiusInKm),
    },
  };
};

// ─────────────────────────────────────────
// CALCULATE MATCH SCORE BASED ON DISTANCE
// ─────────────────────────────────────────
const getDistanceScore = (distanceKm, maxRadiusKm = 10) => {
  if (distanceKm <= 0) return 100;
  if (distanceKm >= maxRadiusKm) return 0;
  const score = ((maxRadiusKm - distanceKm) / maxRadiusKm) * 100;
  return Math.round(score);
};

export {
  isValidCoordinates,
  createGeoPoint,
  calculateDistance,
  kmToMeters,
  buildGeoQuery,
  getDistanceScore,
};
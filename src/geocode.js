const fetch = require('node-fetch');

/**
 * Geocode a free-text place name into { latitude, longitude, displayName }
 * using OpenStreetMap's Nominatim (no API key required).
 *
 * NOTE: Nominatim's usage policy requires a descriptive User-Agent and asks
 * that you do not send more than ~1 request/second. Fine for this app's
 * scale; for high traffic, swap in a paid geocoder (Google/Mapbox/etc).
 */
async function geocodePlace(place) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    place
  )}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'NavagrahaAstrology/1.0 (contact: yourrealemail@gmail.com)'
    }
  });

  if (!res.ok) {
    throw new Error(`Geocoding request failed: ${res.status}`);
  }

  const results = await res.json();
  if (!results || results.length === 0) {
    throw new Error(`Could not find location: "${place}". Try a more specific name (e.g. "City, State, Country").`);
  }

  const best = results[0];
  return {
    latitude: parseFloat(best.lat),
    longitude: parseFloat(best.lon),
    displayName: best.display_name
  };
}

module.exports = { geocodePlace };

const { Origin, Horoscope } = require('circular-natal-horoscope-js');

// The classical Navagraha ("nine seizers/planets") of Vedic astrology:
// 7 visible bodies + the two lunar nodes (Rahu = North Node, Ketu = South Node).
// Modern outer planets (Uranus/Neptune/Pluto) are intentionally excluded —
// they have no place in traditional Navagraha charts.
const GRAHA_BODY_KEYS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

const NODE_LABELS = { northnode: 'Rahu', southnode: 'Ketu' };

/**
 * Build a real natal chart (Vedic-style: sidereal zodiac, whole-sign houses).
 *
 * @param {Object} p
 * @param {number} p.year
 * @param {number} p.month 1-12 (calendar month, will be converted to 0-indexed internally)
 * @param {number} p.date 1-31
 * @param {number} p.hour 0-23
 * @param {number} p.minute 0-59
 * @param {number} p.latitude
 * @param {number} p.longitude
 */
function buildChart({ year, month, date, hour, minute, latitude, longitude }) {
  const origin = new Origin({
    year,
    month: month - 1, // library expects 0 = January
    date,
    hour,
    minute,
    latitude,
    longitude
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: 'whole-sign', // classical Vedic house system
    zodiac: 'sidereal',        // Vedic charts use the sidereal zodiac
    aspectPoints: ['bodies', 'angles'],
    aspectWithPoints: ['bodies', 'angles'],
    aspectTypes: ['major'],
    language: 'en'
  });

  const bodies = GRAHA_BODY_KEYS.map((key) => {
    const body = horoscope.CelestialBodies[key];
    if (!body) return null;
    return {
      key,
      label: body.label,
      sign: body.Sign.label || body.Sign.key,
      house: body.House ? body.House.id : null,
      degree: body.ChartPosition.Ecliptic.ArcDegreesFormatted30,
      retrograde: !!body.isRetrograde
    };
  }).filter(Boolean);

  // Rahu (North Node) & Ketu (South Node) — always exactly 180° apart
  const nodes = ['northnode', 'southnode'].map((key) => {
    const point = horoscope.CelestialPoints[key];
    if (!point) return null;
    return {
      key,
      label: NODE_LABELS[key],
      sign: point.Sign.label || point.Sign.key,
      house: point.House ? point.House.id : null,
      degree: point.ChartPosition.Ecliptic.ArcDegreesFormatted30,
      retrograde: false // nodes are always retrograde by convention; not a meaningful flag here
    };
  }).filter(Boolean);

  const planets = [...bodies, ...nodes];

  const ascendant = {
    sign: horoscope.Ascendant.Sign.label || horoscope.Ascendant.Sign.key,
    degree: horoscope.Ascendant.ChartPosition.Ecliptic.ArcDegreesFormatted30
  };

  const moon = planets.find((p) => p.key === 'moon');

  return {
    timezoneUsed: origin.timezone && origin.timezone.name,
    utcTime: origin.utcTimeFormatted,
    ascendant,
    moonSign: moon ? moon.sign : null, // Rashi
    planets,
    houseSystem: 'whole-sign',
    zodiac: 'sidereal'
  };
}

module.exports = { buildChart };

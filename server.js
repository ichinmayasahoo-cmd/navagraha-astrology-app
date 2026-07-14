require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { geocodePlace } = require('./src/geocode');
const { buildChart } = require('./src/astrology');
const { calculateNumerology } = require('./src/numerology');
const { generateReading } = require('./src/claudeClient');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chart', async (req, res) => {
  try {
    const { name, dob, tob, place } = req.body;

    if (!name || !dob || !tob || !place) {
      return res.status(400).json({
        error: 'Please provide name, dob (YYYY-MM-DD), tob (HH:MM), and place of birth.'
      });
    }

    const [year, month, date] = dob.split('-').map(Number);
    const [hour, minute] = tob.split(':').map(Number);

    if (!year || !month || !date || Number.isNaN(hour) || Number.isNaN(minute)) {
      return res.status(400).json({ error: 'dob or tob format is invalid.' });
    }

    // 1. Geocode place of birth -> lat/long
    const location = await geocodePlace(place);

    // 2. Real astronomical/astrological chart calculation
    const chart = buildChart({
      year,
      month,
      date,
      hour,
      minute,
      latitude: location.latitude,
      longitude: location.longitude
    });

    // 3. Numerology (pure math, no AI needed)
    const numerology = calculateNumerology(date, month, year);

    // 4. Claude writes the human-readable interpretation, grounded in the
    //    real computed data above (Claude never invents placements/numbers).
    let reading = null;
    let readingError = null;
    try {
      reading = await generateReading({ name, chart, numerology });
    } catch (err) {
      readingError = err.message;
    }

    res.json({
      name,
      location,
      chart,
      numerology,
      reading,
      readingError
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Something went wrong.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Astrology app running on http://0.0.0.0:${PORT}`);
});

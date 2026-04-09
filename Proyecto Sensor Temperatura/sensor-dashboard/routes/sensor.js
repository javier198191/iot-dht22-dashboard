const express = require('express');
const SensorData = require('../models/SensorData');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const apiKeyAuth = (req, res, next) => {
  if (req.headers['x-api-key'] !== process.env.API_KEY)
    return res.status(401).json({ message: 'API Key inválida' });
  next();
};

router.post('/data', apiKeyAuth, async (req, res) => {
  try {
    const { temperature, humidity } = req.body;
    if (temperature == null || humidity == null)
      return res.status(400).json({ message: 'Datos incompletos' });

    const reading = new SensorData({ temperature, humidity });
    await reading.save();
    console.log(`📡 Lectura guardada → Temp: ${temperature}°C, Hum: ${humidity}%`);
    res.status(201).json({ message: 'Guardado', id: reading._id });
  } catch (err) {
    res.status(500).json({ message: 'Error guardando datos' });
  }
});

router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ timestamp: -1 });
    res.json(latest || {});
  } catch {
    res.status(500).json({ message: 'Error' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const limit = parseInt(req.query.limit) || 200;
    const since = new Date(Date.now() - hours * 3600 * 1000);

    const data = await SensorData.find({ timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .limit(limit);
    res.json(data);
  } catch {
    res.status(500).json({ message: 'Error' });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const data = await SensorData.find({ timestamp: { $gte: since } });
    if (!data.length) return res.json({ count: 0 });

    const temps = data.map(d => d.temperature);
    const hums  = data.map(d => d.humidity);
    const avg   = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

    res.json({
      count: data.length,
      temperature: { min: Math.min(...temps), max: Math.max(...temps), avg: +avg(temps).toFixed(1) },
      humidity:    { min: Math.min(...hums),  max: Math.max(...hums),  avg: +avg(hums).toFixed(1) }
    });
  } catch {
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;
const express = require('express');
const SensorData = require('../models/SensorData');
const authMiddleware = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');
const router = express.Router();

// --- CONFIGURACIÓN DE CORREO ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Recuerda usar "App Password" de Google
  }
});

let ledStatus = 0; // Estado global del LED (0 apagado, 1 encendido)

const apiKeyAuth = (req, res, next) => {
  if (req.headers['x-api-key'] !== process.env.API_KEY)
    return res.status(401).json({ message: 'API Key inválida' });
  next();
};

// Enviar datos y verificar alertas
router.post('/data', apiKeyAuth, async (req, res) => {
  try {
    const { temperature, humidity } = req.body;
    if (temperature == null || humidity == null)
      return res.status(400).json({ message: 'Datos incompletos' });

    const reading = new SensorData({ temperature, humidity });
    await reading.save();

    // LÓGICA DE ALERTA POR EMAIL
    if (temperature > 30 || humidity > 70) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'tu-correo@ejemplo.com', // Puedes dinamizar esto con el email del usuario logueado
        subject: '⚠️ ALERTA: Niveles Críticos detectados',
        text: `Se han detectado niveles altos en el sensor.\n\nTemperatura: ${temperature}°C\nHumedad: ${humidity}%\nFecha: ${new Date().toLocaleString()}`
      };
      
      transporter.sendMail(mailOptions, (error) => {
        if (error) console.error('❌ Error enviando email:', error);
        else console.log('📧 Alerta enviada correctamente');
      });
    }

    console.log(`📡 Lectura guardada → Temp: ${temperature}°C, Hum: ${humidity}%`);
    res.status(201).json({ message: 'Guardado', id: reading._id });
  } catch (err) {
    res.status(500).json({ message: 'Error guardando datos' });
  }
});

// Controlar LED desde el Dashboard
router.post('/led', authMiddleware, (req, res) => {
  ledStatus = req.body.status;
  res.json({ message: `LED ${ledStatus ? 'encendido' : 'apagado'}`, status: ledStatus });
});

let ledStatus = 0;

// Consultar estado del LED desde el ESP8266
router.get('/led-status', (req, res) => {
  res.json({ status: ledStatus });
});

// Los demás endpoints (latest, history, stats) se mantienen igual...
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ timestamp: -1 });
    res.json(latest || {});
  } catch { res.status(500).json({ message: 'Error' }); }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const limit = parseInt(req.query.limit) || 200;
    const since = new Date(Date.now() - hours * 3600 * 1000);
    const data = await SensorData.find({ timestamp: { $gte: since } }).sort({ timestamp: 1 }).limit(limit);
    res.json(data);
  } catch { res.status(500).json({ message: 'Error' }); }
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
  } catch { res.status(500).json({ message: 'Error' }); }
});

module.exports = router;
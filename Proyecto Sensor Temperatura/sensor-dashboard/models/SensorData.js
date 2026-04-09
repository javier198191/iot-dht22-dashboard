const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  temperature: { type: Number, required: true },
  humidity:    { type: Number, required: true },
  timestamp:   { type: Date, default: Date.now }
});

sensorDataSchema.index({ timestamp: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
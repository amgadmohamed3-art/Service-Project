require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const HealthChecker = require('../shared/health');

const app = express();
app.use(cors());
app.use(express.json());

// TODO: replace with real MongoDB URI in .env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/user-service';
mongoose.connect(MONGO_URI).then(()=>console.log('user-service: MongoDB connected')).catch(console.error);

// Initialize health checker
const healthChecker = new HealthChecker('user-service', {
  checkDatabase: true,
  databaseUri: MONGO_URI
});

// Health endpoints
app.get('/', (req, res) => res.json({ service: 'user-service', status: 'ok' }));

app.get('/health', async (req, res) => {
  try {
    const healthStatus = await healthChecker.getHealthStatus();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      service: 'user-service'
    });
  }
});

app.get('/health/live', (req, res) => {
  res.json(healthChecker.getLiveness());
});

app.get('/health/ready', async (req, res) => {
  try {
    const readiness = await healthChecker.getReadiness();
    const statusCode = readiness.status === 'ready' ? 200 : 503;
    res.status(statusCode).json(readiness);
  } catch (error) {
    res.status(500).json({
      status: 'not-ready',
      error: error.message,
      service: 'user-service'
    });
  }
});

// Add routes
const routes = require('./src/routes/index');
app.use('/api', routes);

const PORT = process.env.PORT || 6001;
app.listen(PORT, ()=>console.log('user-service running on port', PORT));

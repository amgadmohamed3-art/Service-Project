require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const HealthChecker = require('../shared/health');

const app = express();
app.use(cors());
app.use(express.json());

const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://localhost:6003';

// TODO: replace with real MongoDB URI in .env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/search-service';
mongoose.connect(MONGO_URI).then(()=>console.log('search-service: MongoDB connected')).catch(console.error);

// Initialize health checker
const healthChecker = new HealthChecker('search-service', {
  checkDatabase: false, // Search service uses in-memory cache
  checkDependentServices: [
    {
      name: 'content-service',
      url: CONTENT_SERVICE_URL
    }
  ],
  checkExternalApis: [
    {
      name: 'OMDb API',
      url: `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY || 'test'}&s=movie`,
      timeout: 5000
    }
  ]
});

// Health endpoints
app.get('/', (req, res) => res.json({ service: 'search-service', status: 'ok' }));

app.get('/health', async (req, res) => {
  try {
    const healthStatus = await healthChecker.getHealthStatus();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      service: 'search-service'
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
      service: 'search-service'
    });
  }
});

// Add routes
const routes = require('./src/routes/index');
app.use('/api', routes);

const PORT = process.env.PORT || 6005;
app.listen(PORT, ()=>console.log('search-service running on port', PORT));

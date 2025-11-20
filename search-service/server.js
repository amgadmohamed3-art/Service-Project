require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// TODO: replace with real MongoDB URI in .env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/search-service';
mongoose.connect(MONGO_URI).then(()=>console.log('search-service: MongoDB connected')).catch(console.error);

// Basic health route
app.get('/', (req, res) => res.json({ service: 'search-service', status: 'ok' }));

// Add routes
const routes = require('./src/routes/index');
app.use('/api', routes);

const PORT = process.env.PORT || 6005;
app.listen(PORT, ()=>console.log('search-service running on port', PORT));

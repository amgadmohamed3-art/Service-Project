require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// TODO: replace with real MongoDB URI in .env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/admin-service';
mongoose.connect(MONGO_URI).then(()=>console.log('admin-service: MongoDB connected')).catch(console.error);

// Basic health route
app.get('/', (req, res) => res.json({ service: 'admin-service', status: 'ok' }));

// Add routes
const routes = require('./src/routes/index');
app.use('/api', routes);

const PORT = process.env.PORT || 6008;
app.listen(PORT, ()=>console.log('admin-service running on port', PORT));

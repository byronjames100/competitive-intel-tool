require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const briefRouter  = require('./routes/brief');
const exportRouter = require('./routes/export');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client')));

// Rate limiting — 20 brief requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please wait and try again.' }
});
app.use('/api/', limiter);

// API routes
app.use('/api/brief',  briefRouter);
app.use('/api/export', exportRouter);

// Fallback: serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`IRONSCOUT server running on port ${PORT}`);
});

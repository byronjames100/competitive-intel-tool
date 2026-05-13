require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path       = require('path');

require('./db'); // initialize SQLite on startup

const briefRouter   = require('./routes/brief');
const briefsRouter  = require('./routes/briefs');
const exportRouter  = require('./routes/export');
const authRouter    = require('./routes/auth');
const profileRouter = require('./routes/profile');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));

// Rate limiting — 20 brief requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please wait and try again.' }
});
app.use('/api/', limiter);

// API routes
app.use('/api/auth',    authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/briefs',  briefsRouter);
app.use('/api/brief',   briefRouter);
app.use('/api/export',  exportRouter);

// Static frontend files — must come after API routes
app.use(express.static(path.join(__dirname, '../client')));

// Fallback: serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`IRONSCOUT server running on port ${PORT}`);
});

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const prospectusRoutes = require('./routes/prospectus');
const authRoutes = require('./routes/auth');
const petitionRoutes = require('./routes/petitions');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json());

// Database Connection URI
const dbUser = process.env.DB_USER || '';
const dbPass = process.env.DB_PASS || '';
const dbName = process.env.DB_NAME || 'semestral_flow';

const mongoUri = process.env.MONGODB_URI || (
  dbUser && dbPass 
    ? `mongodb://${dbUser}:${dbPass}@localhost:27017/${dbName}`
    : `mongodb://localhost:27017/${dbName}`
);

// Connect Mongoose
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 3000
}).then(() => {
  console.log('✅ Connected successfully to DCISM MongoDB database via Mongoose.');
}).catch(err => {
  console.warn('⚠️ Could not connect to MongoDB directly. Using memory/seed fallback for API operations:', err.message);
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Backend is running live!',
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Fallback Mode',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/petitions', petitionRoutes);
app.use('/api', prospectusRoutes);

// Serve Static React Frontend Production Build
const clientBuildPath = path.join(__dirname, 'client', 'build');
app.use(express.static(clientBuildPath));

// Catch-all route for Express 5 (path-to-regexp v8 compatible)
app.get('(.*)', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Semestral Flow backend server running live on port ${PORT}`);
});
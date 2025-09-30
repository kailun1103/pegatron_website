// src/routes/index.js
const express = require('express');
const router = express.Router();
const usersRoutes = require('./users');
const { uploadMiddleware, handleUpload } = require('../middlewares/upload');
const { checkHealth } = require('../controllers/healthController');

// Health check
router.get('/health', checkHealth);

// API routes
router.use('/api/users', usersRoutes);
router.post('/api/upload', uploadMiddleware, handleUpload);

module.exports = router;

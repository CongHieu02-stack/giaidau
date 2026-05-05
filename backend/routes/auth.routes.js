const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me (protected)
router.get('/me', authenticate, authController.me);

// POST /api/auth/logout
router.post('/logout', authController.logout);

module.exports = router;

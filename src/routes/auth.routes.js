const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

// Public route — no token needed
router.post('/login', login);

// Protected route — must be logged in
router.get('/me', verifyToken, getMe);

module.exports = router;
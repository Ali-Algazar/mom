// routes/chatbotRoutes.js

const express = require('express');
const router = express.Router();
const { askGenerativeAI } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware'); // حماية المسار

// POST /api/v1/chatbot/ask
// (نحميه بـ "protect" حتى لا يتم استهلاكه إلا من المستخدمين المسجلين)
router.post('/ask', protect, askGenerativeAI);

module.exports = router;
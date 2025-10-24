// routes/cronRoutes.js
const express = require('express');
const router = express.Router();
const { triggerNotifications } = require('../controllers/cronController');

// تعريف الـ Endpoint اللي Vercel هينادي عليه
// GET /api/v1/cron/send-reminders
router.get('/send-reminders', triggerNotifications);

module.exports = router;
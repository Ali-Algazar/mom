// routes/mainRoutes.js

const express = require('express');
const router = express.Router();

// 1. نقوم بـ "استيراد" الوظيفة التي كتبناها في المتحكم
const { getWelcomeMessage } = require('../controllers/welcomeController');

// 2. نقوم بربط المسار (/) بالوظيفة
// هذا يعني: "عندما يأتيك طلب GET على المسار / ، قم بتشغيل وظيفة getWelcomeMessage"
router.get('/', getWelcomeMessage);

// 3. تصدير الـ router لاستخدامه في الملف الرئيسي
module.exports = router;
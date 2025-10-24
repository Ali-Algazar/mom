// controllers/cronController.js
const asyncHandler = require('express-async-handler');
const { sendVaccinationReminders } = require('../jobs/notificationScheduler');

/**
 * @desc    الزناد (Trigger) الخاص بمهمة الإشعارات المجدولة
 * @route   GET /api/v1/cron/send-reminders
 * @access  Private (باستخدام مفتاح سري)
 */
const triggerNotifications = asyncHandler(async (req, res) => {
    // --- التحقق الأمني ---
    // هنتأكد من وجود مفتاح سري جاي في الهيدر أو الرابط
    // المفتاح ده (CRON_SECRET) هتحطه في متغيرات البيئة في Vercel
    const secret = req.headers['authorization']?.split(' ')[1] || req.query.secret;
    if (secret !== process.env.CRON_SECRET) {
        console.warn('[Cron Trigger]: محاولة غير مصرح بها لتشغيل المهمة.');
        return res.status(401).json({ message: 'غير مصرح لك' });
    }
    // --------------------

    console.log('[Cron Trigger]: تم استقبال طلب تشغيل مهمة الإشعارات.');
    const result = await sendVaccinationReminders(); // تشغيل المهمة
    console.log('[Cron Trigger]: انتهت مهمة الإشعارات.', result);

    // إرجاع نتيجة المهمة
    res.status(result.success ? 200 : 500).json(result);
});

module.exports = { triggerNotifications };
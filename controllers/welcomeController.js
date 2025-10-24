// controllers/welcomeController.js

/**
 * @desc    جلب رسالة الترحيب
 * @route   GET /
 * @access  Public
 */
const getWelcomeMessage = (req, res) => {
  // بدلاً من .send، نستخدم .json لإرسال رد احترافي
  res.status(200).json({
    success: true,
    message: "أهلاً بك! هذه الرسالة قادمة من المتحكم (Controller)!"
  });
};

// نقوم "بتصدير" هذه الوظيفة لجعلها متاحة للملفات الأخرى
module.exports = {
  getWelcomeMessage,
};
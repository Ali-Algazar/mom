// controllers/chatbotController.js

const asyncHandler = require('express-async-handler');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. إعداد الاتصال بـ Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * @desc    (الخيار الثاني) الرد على سؤال باستخدام الذكاء الاصطناعي
 * @route   POST /api/v1/chatbot/ask
 * @access  Private (لأننا لا نريد أن يسيء أي شخص استخدامه)
 */
const askGenerativeAI = asyncHandler(async (req, res) => {
  const { query } = req.body;

  if (!query) {
    res.status(400);
    throw new Error('الرجاء إدخال سؤال (query)');
  }

  // --- (2. تخصيص "شخصية" البوت) ---
  // هذا أهم جزء لجعل الردود آمنة ومناسبة
  const prompt = `
    أنت مساعد ذكي في تطبيق مصري لمتابعة صحة الأطفال والأمهات.
    مهمتك هي الإجابة على الأسئلة الطبية والصحية العامة فقط.
    
    **قواعد صارمة:**
    1.  تحدث باللغة العربية (اللهجة المصرية إن أمكن).
    2.  اجعل إجاباتك ودودة، ومطمئنة، وسهلة الفهم.
    3.  **الأهم:** لا تقدم تشخيصاً طبياً.
    4.  **الأهم:** ابدأ دائماً أو اختتم إجابتك بـ "هذه نصيحة عامة ولا تغني عن زيارة الطبيب المختص."
    5.  إذا كان السؤال خارج نطاق (الأمومة، الأطفال، الصحة)، ارفض الإجابة بلطف.

    السؤال هو: "${query}"
  `;

  // 3. إرسال السؤال إلى Gemini
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({
      answer: text,
      source: 'generative-ai', // لتوضيح أن الإجابة من الذكاء الاصطناعي
    });
  } catch (error) {
    console.error('Error from Gemini API:', error);
    res.status(500);
    throw new Error('حدث خطأ أثناء محاولة الاتصال بالمساعد الذكي');
  }
});

module.exports = {
  askGenerativeAI,
};
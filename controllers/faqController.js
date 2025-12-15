const asyncHandler = require('express-async-handler');
const Faq = require('../models/faqModel');

const DISCLAIMER = "\n\n(ملاحظة هامة: هذه معلومات عامة ولا تغني عن استشارة الطبيب المختص.)";

/**
 * @desc    إضافة سؤال (للأدمن)
 * @route   POST /api/v1/faqs
 */
const createFaq = asyncHandler(async (req, res) => {
  const { question, answer, category, keywords } = req.body;

  if (!question || !answer || !category) {
    res.status(400); throw new Error('الرجاء إدخال السؤال، الإجابة، والتصنيف');
  }

  const faq = await Faq.create({
    question,
    answer,
    category,
    keywords: keywords || [],
    addedBy: req.user._id, // تعديل للتوافق مع التوكن الجديد
  });

  res.status(201).json(faq);
});

/**
 * @desc    جلب جميع الأسئلة
 * @route   GET /api/v1/faqs
 */
const getAllFaqs = asyncHandler(async (req, res) => {
  let query = {};
  if (req.query.category) {
    query.category = req.query.category;
  }
  const faqs = await Faq.find(query)
    .populate('addedBy', 'name')
    .sort({ question: 1 });
  res.status(200).json(faqs);
});

/**
 * @desc    (للبوت) البحث الذكي (Atlas Search + Regex Fallback)
 * @route   GET /api/v1/faqs/search
 */
const searchFaqs = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    res.status(400); throw new Error('الرجاء إدخال نص للبحث (q)');
  }

  try {
    // ---------------------------------------------------------
    // 🌟 المحاولة الأولى: استخدام كودك المتقدم (Atlas Search) 🌟
    // ---------------------------------------------------------
    const pipeline = [
      {
        $search: {
          index: 'default', 
          text: {
            query: q, 
            path: ['question', 'keywords'], 
            fuzzy: { maxEdits: 1, prefixLength: 2 },
          },
        },
      },
      {
        $addFields: { score: { $meta: 'searchScore' }, },
      },
      { $sort: { score: -1 } },
      { $limit: 1 }, 
    ];

    const results = await Faq.aggregate(pipeline);

    // --- منطق الرد الذكي بتاعك (3 مراحل) ---
    if (results.length > 0 && results[0].score > 0.075) {
      // 1. إجابة قوية
      return res.status(200).json({
        answer: results[0].answer + DISCLAIMER,
        source: 'database-atlas-strong',
        matchedQuestion: results[0].question,
        score: results[0].score,
      });
    } 
    else if (results.length > 0) { 
      // 2. إجابة ضعيفة
      const fallbackAnswer = `عفواً، لم أجد إجابة مطابقة تماماً لسؤالك. أقرب سؤال وجدته هو: "${results[0].question}"\n\nإذا لم يكن هذا ما تبحث عنه، يرجى استشارة الطبيب.`;
      return res.status(200).json({
        answer: fallbackAnswer + DISCLAIMER,
        source: 'database-atlas-weak', 
        matchedQuestion: results[0].question,
        score: results[0].score,
      });
    }

    // لو Atlas اشتغل بس ملقاش نتايج خالص، هنكمل للكود اللي تحت (Fallback)

  } catch (error) {
    // لو حصل خطأ (مثلاً Atlas Search مش شغال محلياً)، منوقفش التطبيق
    console.log("⚠️ Atlas Search failed or not configured, switching to Regex fallback.");
  }

  // ---------------------------------------------------------
  // 🛡️ الخطة البديلة: بحث Regex عادي (عشان يشتغل معاك دلوقتي) 🛡️
  // ---------------------------------------------------------
  const regexResults = await Faq.findOne({
      $or: [
          { question: { $regex: q, $options: 'i' } },
          { keywords: { $in: [new RegExp(q, 'i')] } }
      ]
  });

  if (regexResults) {
      return res.status(200).json({
          answer: regexResults.answer + DISCLAIMER,
          source: 'database-regex',
          matchedQuestion: regexResults.question
      });
  }

  // 3. لم نجد شيئاً في النهاية
  res.status(200).json({
    answer: "عفواً، ليس لدي إجابة موثوقة على هذا السؤال في قاعدة بياناتي." + DISCLAIMER,
    source: 'system-fallback', 
    matchedQuestion: null,
    score: 0,
  });
});

/**
 * @desc    جلب سؤال بالـ ID
 */
const getFaqById = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id).populate('addedBy', 'name');
  if (faq) res.status(200).json(faq);
  else { res.status(404); throw new Error('السؤال غير موجود'); }
});

/**
 * @desc    تعديل سؤال
 */
const updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faq) { res.status(404); throw new Error('السؤال غير موجود'); }
  res.status(200).json(faq);
});

/**
 * @desc    حذف سؤال
 */
const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) { res.status(404); throw new Error('السؤال غير موجود'); }
  await faq.deleteOne();
  res.status(200).json({ success: true, message: 'تم الحذف' });
});

module.exports = {
  createFaq,
  getAllFaqs,
  searchFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
};
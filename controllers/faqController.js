// controllers/faqController.js

const asyncHandler = require('express-async-handler');
const Faq = require('../models/faqModel');

// --- (1. تعريف جملة التنبيه كثابت) ---
const DISCLAIMER = "\n\n(ملاحظة هامة: هذه معلومات عامة ولا تغني عن استشارة الطبيب المختص.)";

/**
 * @desc    إضافة سؤال شائع جديد (للأدمن)
 * @route   POST /api/v1/faqs
 * @access  Private/Admin
 */
const createFaq = asyncHandler(async (req, res) => {
  const { question, answer, category, keywords } = req.body;

  if (!question || !answer || !category) {
    res.status(400);
    throw new Error('الرجاء إدخال السؤال، الإجابة، والتصنيف');
  }

  const faq = await Faq.create({
    question,
    answer,
    category,
    keywords: keywords || [],
    addedBy: req.user.id, // الربط بالأدمن
  });

  res.status(201).json(faq);
});

/**
 * @desc    جلب جميع الأسئلة الشائعة (للمستخدم)
 * @route   GET /api/v1/faqs
 * @access  Public
 */
const getAllFaqs = asyncHandler(async (req, res) => {
  let query = {};
  if (req.query.category) {
    query.category = req.query.category;
  }
  const faqs = await Faq.find(query)
    .populate('addedBy', 'name')
    .sort({ question: 'asc' });
  res.status(200).json(faqs);
});

/**
 * @desc    (للبوت) البحث الذكي عن إجابة (باستخدام Atlas Search)
 * @route   GET /api/v1/faqs/search
 * @access  Public
 */
const searchFaqs = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    res.status(400);
    throw new Error('الرجاء إدخال نص للبحث (q)');
  }

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
      $addFields: {
        score: { $meta: 'searchScore' },
      },
    },
    { $sort: { score: -1 } },
    { $limit: 1 }, 
  ];

  const results = await Faq.aggregate(pipeline);

  // --- (2. هذا هو التطوير: منطق الرد الذكي بثلاث مراحل) ---
  
  // (المرحلة 1: وجدنا إجابة قوية ومطابقة)
  if (results.length > 0 && results[0].score > 0.075) {
    const dbAnswer = results[0].answer;
    
    res.status(200).json({
      answer: dbAnswer + DISCLAIMER, // <-- إضافة التنبيه هنا
      source: 'database',
      matchedQuestion: results[0].question,
      score: results[0].score,
    });
  } 
  // (المرحلة 2: وجدنا إجابة "ضعيفة" - هذا هو التعديل الجديد)
  else if (results.length > 0) { 
    const fallbackAnswer = `عفواً، لم أجد إجابة مطابقة تماماً لسؤالك. أقرب سؤال وجدته هو: "${results[0].question}"\n\nإذا لم يكن هذا ما تبحث عنه،`;
    
    res.status(200).json({
      answer: fallbackAnswer + " يرجى استشارة الطبيب." + DISCLAIMER, // <-- إضافة التنبيه هنا
      source: 'system-low-score', 
      matchedQuestion: results[0].question,
      score: results[0].score, // (سيعرض لنا الدرجة الضعيفة)
    });
  } 
  // (المرحلة 3: لم نجد أي شيء على الإطلاق)
  else { 
    const fallbackAnswer = "عفواً، ليس لدي إجابة موثوقة على هذا السؤال في قاعدة بياناتي.";
    
    res.status(200).json({
      answer: fallbackAnswer + DISCLAIMER, // <-- إضافة التنبيه هنا أيضاً
      source: 'system-fallback', 
      matchedQuestion: null,
      score: 0,
    });
  }
});


/**
 * @desc    جلب سؤال واحد عن طريق ID
 * @route   GET /api/v1/faqs/:id
 * @access  Public
 */
const getFaqById = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id).populate('addedBy', 'name');
  if (faq) {
    res.status(200).json(faq);
  } else {
    res.status(404);
    throw new Error('لم يتم العثور على السؤال');
  }
});

/**
 * @desc    تعديل سؤال (للأدمن)
 * @route   PUT /api/v1/faqs/:id
 * @access  Private/Admin
 */
const updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) {
    res.status(404);
    throw new Error('لم يتم العثور على السؤال');
  }
  const updatedFaq = await Faq.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json(updatedFaq);
});

/**
 * @desc    حذف سؤال (للأدمن)
 * @route   DELETE /api/v1/faqs/:id
 * @access  Private/Admin
 */
const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) {
    res.status(404);
    throw new Error('لم يتم العثور على السؤال');
  }
  await Faq.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'تم حذف السؤال بنجاح' });
});

module.exports = {
  createFaq,
  getAllFaqs,
  searchFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
};
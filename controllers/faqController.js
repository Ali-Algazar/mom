const Faq = require('../models/faqModel');
const asyncHandler = require('express-async-handler');

// @desc    جلب الأسئلة (ممكن نفلتر بالقسم category)
// @route   GET /api/v1/faqs?category=vaccination
const getFaqs = asyncHandler(async (req, res) => {
  let query = {};
  
  // لو باعت قسم معين في الرابط، هات أسئلة القسم ده بس
  if (req.query.category) {
      query.category = req.query.category;
  }

  const faqs = await Faq.find(query).sort({ createdAt: -1 });
  res.status(200).json(faqs);
});

// @desc    البحث الذكي (الشات بوت) 🤖
// @route   POST /api/v1/faqs/search
const searchFaqs = asyncHandler(async (req, res) => {
  const { query } = req.body;

  if (!query) {
    res.status(400); throw new Error('يرجى كتابة سؤال للبحث');
  }

  // 🔥 البحث المتقدم 🔥
  // بندور في "نص السؤال" OR "الكلمات المفتاحية"
  const faqs = await Faq.find({
      $or: [
          { question: { $regex: query, $options: 'i' } }, // بحث في السؤال
          { keywords: { $in: [new RegExp(query, 'i')] } } // بحث في الكلمات المفتاحية
      ]
  });

  if (faqs.length === 0) {
      res.status(200).json([{
          question: query,
          answer: "عذراً، لم أجد إجابة دقيقة في قاعدة البيانات. يرجى تجربة كلمات أخرى أو مراجعة الطبيب."
      }]);
  } else {
      res.status(200).json(faqs);
  }
});

// @desc    إضافة سؤال جديد (للأدمن)
// @route   POST /api/v1/faqs
const createFaq = asyncHandler(async (req, res) => {
  const { question, answer, category, keywords } = req.body;

  if (!question || !answer || !category) {
      res.status(400); throw new Error('البيانات ناقصة (السؤال، الإجابة، التصنيف)');
  }

  // تحويل الكلمات المفتاحية لمصفوفة لو جاية نص
  // (مثال: "حرارة, سخونية" -> ["حرارة", "سخونية"])
  let keywordArray = keywords;
  if (typeof keywords === 'string') {
      keywordArray = keywords.split(',').map(k => k.trim());
  }

  const faq = await Faq.create({
      question,
      answer,
      category,
      keywords: keywordArray,
      addedBy: req.user._id // 🔥 بيجيب الادمن من التوكن
  });

  res.status(201).json(faq);
});

// @desc    تعديل سؤال
// @route   PUT /api/v1/faqs/:id
const updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faq) { res.status(404); throw new Error('غير موجود'); }
  res.status(200).json(faq);
});

// @desc    حذف سؤال
// @route   DELETE /api/v1/faqs/:id
const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) { res.status(404); throw new Error('غير موجود'); }
  await faq.deleteOne();
  res.status(200).json({ message: 'تم الحذف' });
});

module.exports = {
  getFaqs,
  searchFaqs,
  createFaq,
  updateFaq,
  deleteFaq
};
const Faq = require('../models/faqModel'); // تأكد إن الموديل موجود
const asyncHandler = require('express-async-handler');

// @desc    جلب كل الأسئلة
const getFaqs = asyncHandler(async (req, res) => {
  const faqs = await Faq.find({});
  res.status(200).json(faqs);
});

// @desc    البحث في الأسئلة (للشات بوت)
const searchFaqs = asyncHandler(async (req, res) => {
  const { query } = req.body;
  // بحث بسيط لحد ما نركب Atlas Search
  const faqs = await Faq.find({ 
      question: { $regex: query, $options: 'i' } 
  });
  res.status(200).json(faqs);
});

// @desc    إضافة سؤال (للوزارة)
const createFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.create(req.body);
  res.status(201).json(faq);
});

// @desc    تعديل سؤال
const updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faq) { res.status(404); throw new Error('السؤال غير موجود'); }
  res.status(200).json(faq);
});

// @desc    حذف سؤال
const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) { res.status(404); throw new Error('السؤال غير موجود'); }
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
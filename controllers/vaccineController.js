const Vaccine = require('../models/vaccineModel');
const asyncHandler = require('express-async-handler');

// @desc    جلب كل التطعيمات الأساسية (Master List)
// @route   GET /api/v1/vaccines
// @access  Public (أو Private حسب رغبتك)
const getVaccines = asyncHandler(async (req, res) => {
  const vaccines = await Vaccine.find().sort({ ageInMonths: 1 }); // ترتيب حسب العمر
  res.status(200).json(vaccines);
});

// @desc    إضافة تطعيم جديد (للوزارة فقط)
// @route   POST /api/v1/vaccines
// @access  Private (Super Admin)
const addVaccine = asyncHandler(async (req, res) => {
  const { name, description, ageInMonths, mandatory } = req.body;

  if (!name || ageInMonths === undefined) {
    res.status(400); throw new Error('يرجى إضافة اسم التطعيم وعمر الاستحقاق');
  }

  const vaccine = await Vaccine.create({
    name,
    description,
    ageInMonths,
    mandatory: mandatory !== false // افتراضياً إجباري
  });

  res.status(201).json(vaccine);
});

// @desc    تعديل تطعيم
// @route   PUT /api/v1/vaccines/:id
// @access  Private (Super Admin)
const updateVaccine = asyncHandler(async (req, res) => {
  const vaccine = await Vaccine.findById(req.params.id);
  if (!vaccine) {
    res.status(404); throw new Error('التطعيم غير موجود');
  }

  const updatedVaccine = await Vaccine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.status(200).json(updatedVaccine);
});

// @desc    حذف تطعيم
// @route   DELETE /api/v1/vaccines/:id
// @access  Private (Super Admin)
const deleteVaccine = asyncHandler(async (req, res) => {
  const vaccine = await Vaccine.findById(req.params.id);
  if (!vaccine) {
    res.status(404); throw new Error('التطعيم غير موجود');
  }

  await vaccine.deleteOne();
  res.status(200).json({ message: 'تم حذف التطعيم بنجاح' });
});

module.exports = {
  getVaccines,
  addVaccine,
  updateVaccine,
  deleteVaccine,
};
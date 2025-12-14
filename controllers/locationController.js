const HealthUnit = require('../models/healthUnitModel');
const asyncHandler = require('express-async-handler');

// @desc    إضافة وحدة صحية جديدة (للوزارة فقط)
// @route   POST /api/v1/locations
// @access  Private (Super Admin)
const createHealthUnit = asyncHandler(async (req, res) => {
  const { name, governorate, city } = req.body;

  if (!name || !governorate || !city) {
    res.status(400); throw new Error('البيانات ناقصة');
  }

  const unitExists = await HealthUnit.findOne({ name });
  if (unitExists) {
    res.status(400); throw new Error('هذه الوحدة مسجلة بالفعل');
  }

  const unit = await HealthUnit.create({ name, governorate, city });
  res.status(201).json(unit);
});

// @desc    جلب الوحدات الصحية (للقوائم والفلترة)
// @route   GET /api/v1/locations
// @access  Public
const getHealthUnits = asyncHandler(async (req, res) => {
  let query = {};
  if (req.query.governorate) query.governorate = req.query.governorate;
  if (req.query.city) query.city = req.query.city;

  const units = await HealthUnit.find(query).sort({ name: 1 });
  res.status(200).json(units);
});

// @desc    تعديل بيانات وحدة صحية (للوزارة فقط)
// @route   PUT /api/v1/locations/:id
// @access  Private (Super Admin)
const updateHealthUnit = asyncHandler(async (req, res) => {
  const unit = await HealthUnit.findById(req.params.id);

  if (!unit) {
    res.status(404); throw new Error('الوحدة الصحية غير موجودة');
  }

  // التعديل (New: true عشان يرجع البيانات الجديدة)
  const updatedUnit = await HealthUnit.findByIdAndUpdate(
    req.params.id, 
    req.body, 
    { new: true }
  );

  res.status(200).json(updatedUnit);
});

// @desc    حذف وحدة صحية (للوزارة فقط)
// @route   DELETE /api/v1/locations/:id
// @access  Private (Super Admin)
const deleteHealthUnit = asyncHandler(async (req, res) => {
  const unit = await HealthUnit.findById(req.params.id);

  if (!unit) {
    res.status(404); throw new Error('الوحدة الصحية غير موجودة');
  }

  await unit.deleteOne();

  res.status(200).json({ message: 'تم حذف الوحدة الصحية بنجاح' });
});

module.exports = {
  createHealthUnit,
  getHealthUnits,
  updateHealthUnit, // دالة جديدة
  deleteHealthUnit  // دالة جديدة
};
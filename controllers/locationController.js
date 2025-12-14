const HealthUnit = require('../models/healthUnitModel');
const asyncHandler = require('express-async-handler');

// @desc    إضافة وحدة صحية جديدة (للوزارة فقط)
// @route   POST /api/v1/locations
// @access  Private (Super Admin)
const createHealthUnit = asyncHandler(async (req, res) => {
  const { name, governorate, city } = req.body;

  if (!name || !governorate || !city) {
    res.status(400);
    throw new Error('الرجاء إدخال جميع البيانات (الاسم، المحافظة، المدينة)');
  }

  const unitExists = await HealthUnit.findOne({ name });
  if (unitExists) {
    res.status(400);
    throw new Error('هذه الوحدة الصحية مسجلة بالفعل');
  }

  const unit = await HealthUnit.create({
    name,
    governorate,
    city,
  });

  res.status(201).json(unit);
});

// @desc    جلب الوحدات الصحية (للقوائم المنسدلة)
// @route   GET /api/v1/locations
// @access  Public (أو Private حسب الحاجة)
const getHealthUnits = asyncHandler(async (req, res) => {
  // ممكن نفلتر بالمحافظة لو مبعوتة في الرابط
  // مثال: ?governorate=البحيرة
  let query = {};
  if (req.query.governorate) {
    query.governorate = req.query.governorate;
  }
  if (req.query.city) {
    query.city = req.query.city;
  }

  const units = await HealthUnit.find(query).sort({ name: 1 });
  res.status(200).json(units);
});

module.exports = {
  createHealthUnit,
  getHealthUnits,
};
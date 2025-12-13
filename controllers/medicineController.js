const Medicine = require('../models/medicineModel'); // تأكد إن الموديل موجود
const asyncHandler = require('express-async-handler');

// @desc    جلب كل الأدوية
const getMedicines = asyncHandler(async (req, res) => {
  const medicines = await Medicine.find().sort({ name: 1 });
  res.status(200).json(medicines);
});

// @desc    جلب دواء واحد
const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) {
    res.status(404); throw new Error('الدواء غير موجود');
  }
  res.status(200).json(medicine);
});

// @desc    إضافة دواء (للوزارة)
const createMedicine = asyncHandler(async (req, res) => {
  const { name, description, activeIngredient, dose } = req.body;
  if (!name) {
    res.status(400); throw new Error('يرجى إدخال اسم الدواء');
  }
  const medicine = await Medicine.create({
    name, description, activeIngredient, dose
  });
  res.status(201).json(medicine);
});

// @desc    تعديل دواء (للوزارة)
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) {
    res.status(404); throw new Error('الدواء غير موجود');
  }
  const updatedMedicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(updatedMedicine);
});

// @desc    حذف دواء (للوزارة)
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) {
    res.status(404); throw new Error('الدواء غير موجود');
  }
  await medicine.deleteOne();
  res.status(200).json({ message: 'تم حذف الدواء' });
});

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine
};
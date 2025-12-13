const Doctor = require('../models/doctorModel');
const asyncHandler = require('express-async-handler');

// @desc    جلب كل الأطباء
const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({});
  res.status(200).json(doctors);
});

// @desc    جلب الأطباء القريبين (مؤقتاً يرجع الكل حتى نضيف GeoJSON)
const getNearbyDoctors = asyncHandler(async (req, res) => {
  // هنا المفروض نستخدم $near
  const doctors = await Doctor.find({}); 
  res.status(200).json(doctors);
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) { res.status(404); throw new Error('الطبيب غير موجود'); }
  res.status(200).json(doctor);
});

const createDoctor = asyncHandler(async (req, res) => {
  const { name, specialty, address, phone, location } = req.body;
  const doctor = await Doctor.create({ name, specialty, address, phone, location });
  res.status(201).json(doctor);
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doctor) { res.status(404); throw new Error('غير موجود'); }
  res.status(200).json(doctor);
});

const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) { res.status(404); throw new Error('غير موجود'); }
  await doctor.deleteOne();
  res.status(200).json({ message: 'تم الحذف' });
});

module.exports = {
  getDoctors,
  getNearbyDoctors, // مهمة جداً
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
};
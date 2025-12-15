const asyncHandler = require('express-async-handler');
const Doctor = require('../models/doctorModel');

/**
 * @desc    إضافة طبيب جديد (للأدمن)
 * @route   POST /api/v1/doctors
 * @access  Private/SuperAdmin
 */
const createDoctor = asyncHandler(async (req, res) => {
  const { name, address, phone, specialty, location, imageUrl } = req.body;

  // التحقق من المدخلات الأساسية
  if (
    !name ||
    !imageUrl ||
    !address ||
    !location ||
    !location.coordinates || 
    location.coordinates.length !== 2
  ) {
    res.status(400);
    throw new Error(
      'الرجاء إدخال الاسم، العنوان، والموقع (خط الطول وخط العرض)'
    );
  }

  const doctor = await Doctor.create({
    name,
    imageUrl,
    address,
    phone,
    specialty,
    location: {
      type: 'Point',
      // ترتيب GeoJSON هو [خط الطول Longitude, خط العرض Latitude]
      coordinates: [location.coordinates[0], location.coordinates[1]], 
    },
    addedBy: req.user._id, // الربط بالأدمن
  });

  res.status(201).json(doctor);
});

/**
 * @desc    جلب الأطباء الأقرب (للمستخدم)
 * @route   GET /api/v1/doctors/nearby
 * @access  Public
 */
const getNearbyDoctors = asyncHandler(async (req, res) => {
  // مثال: /api/v1/doctors/nearby?lng=31.23&lat=30.04
  const { lng, lat } = req.query;

  if (!lng || !lat) {
    res.status(400);
    throw new Error('الرجاء إرسال خط الطول (lng) وخط العرض (lat)');
  }

  const longitude = parseFloat(lng);
  const latitude = parseFloat(lat);

  const doctors = await Doctor.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: 10000, // 10 كيلومتر
      },
    },
  });

  res.status(200).json(doctors);
});

/**
 * @desc    جلب جميع الأطباء
 * @route   GET /api/v1/doctors
 * @access  Public
 */
const getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({}).populate('addedBy', 'name');
  res.status(200).json(doctors);
});

/**
 * @desc    جلب طبيب واحد
 * @route   GET /api/v1/doctors/:id
 * @access  Public
 */
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('addedBy', 'name');

  if (doctor) {
    res.status(200).json(doctor);
  } else {
    res.status(404); throw new Error('لم يتم العثور على الطبيب');
  }
});

/**
 * @desc    تعديل طبيب
 * @route   PUT /api/v1/doctors/:id
 * @access  Private/SuperAdmin
 */
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    res.status(404); throw new Error('لم يتم العثور على الطبيب');
  }

  const updatedDoctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(updatedDoctor);
});

/**
 * @desc    حذف طبيب
 * @route   DELETE /api/v1/doctors/:id
 * @access  Private/SuperAdmin
 */
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    res.status(404); throw new Error('لم يتم العثور على الطبيب');
  }

  await Doctor.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, message: 'تم حذف الطبيب بنجاح' });
});

module.exports = {
  createDoctor,
  getNearbyDoctors,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
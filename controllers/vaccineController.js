const Vaccine = require('../models/vaccineModel');
const asyncHandler = require('express-async-handler');

// @desc    جلب كل التطعيمات الأساسية (Master List)
// @route   GET /api/v1/vaccines
// @access  Public
const getVaccines = asyncHandler(async (req, res) => {
  const vaccines = await Vaccine.find().sort({ ageInMonths: 1 });
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
    mandatory: mandatory !== false
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

// 🔥 الدالة الجديدة: إدخال جدول التطعيمات المصري بضغطة واحدة 🔥
// @route   POST /api/v1/vaccines/seed
const seedVaccines = asyncHandler(async (req, res) => {
  const egyptianSchedule = [
    { name: 'تطعيم الدرن (BCG)', ageInMonths: 0, description: 'حقن بالجلد في الكتف الأيسر', mandatory: true },
    { name: 'شلل الأطفال (الجرعة الصفرية)', ageInMonths: 0, description: 'نقط بالفم', mandatory: true },
    { name: 'الالتهاب الكبدي ب (الجرعة الصفرية)', ageInMonths: 0, description: 'حقن بالعضل (خلال 24 ساعة)', mandatory: true },
    { name: 'شلل الأطفال (الجرعة الأولى)', ageInMonths: 2, description: 'نقط بالفم', mandatory: true },
    { name: 'الخماسي (الجرعة الأولى)', ageInMonths: 2, description: 'دفتيريا، تيتانوس، سعال ديكي، كبدي ب، انفلونزا', mandatory: true },
    { name: 'شلل الأطفال (الجرعة الثانية)', ageInMonths: 4, description: 'نقط بالفم', mandatory: true },
    { name: 'الخماسي (الجرعة الثانية)', ageInMonths: 4, description: 'حقن بالعضل', mandatory: true },
    { name: 'شلل الأطفال (الجرعة الثالثة)', ageInMonths: 6, description: 'نقط بالفم', mandatory: true },
    { name: 'الخماسي (الجرعة الثالثة)', ageInMonths: 6, description: 'حقن بالعضل', mandatory: true },
    { name: 'شلل الأطفال (الجرعة الرابعة)', ageInMonths: 9, description: 'نقط بالفم', mandatory: true },
    { name: 'شلل الأطفال (الجرعة الخامسة)', ageInMonths: 12, description: 'نقط بالفم', mandatory: true },
    { name: 'MMR (الحصبة، النكاف، الحصبة الألمانية)', ageInMonths: 12, description: 'حقن تحت الجلد', mandatory: true },
    { name: 'شلل الأطفال (الجرعة المنشطة)', ageInMonths: 18, description: 'نقط بالفم', mandatory: true },
    { name: 'MMR (الجرعة الثانية)', ageInMonths: 18, description: 'حقن تحت الجلد', mandatory: true },
    { name: 'الثلاثي البكتيري (DPT)', ageInMonths: 18, description: 'دفتيريا، تيتانوس، سعال ديكي', mandatory: true }
  ];

  await Vaccine.deleteMany({}); // مسح القديم
  await Vaccine.insertMany(egyptianSchedule); // إضافة الجديد

  res.status(201).json({ message: 'تم إدخال جدول التطعيمات المصري بنجاح ✅', count: egyptianSchedule.length });
});

module.exports = {
  getVaccines,
  addVaccine,
  updateVaccine,
  deleteVaccine,
  seedVaccines, // <-- متنساش دي
};
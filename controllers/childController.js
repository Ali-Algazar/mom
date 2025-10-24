// controllers/childController.js

const asyncHandler = require('express-async-handler');
const Child = require('../models/childModel');
const User = require('../models/userModel');
// --- (1. استيراد النماذج الجديدة والمكتبة) ---
const Vaccine = require('../models/vaccineModel');
const ChildVaccination = require('../models/childVaccinationModel');
const { addMonths } = require('date-fns'); // مكتبة التواريخ

/**
 * @desc    إضافة طفل جديد (وجدولة تطعيماته تلقائياً)
 * @route   POST /api/v1/children
 * @access  Private (محمي)
 */
const addChild = asyncHandler(async (req, res) => {
  // 1. استلام البيانات من الـ body
  const { name, dateOfBirth, gender } = req.body;

  // 2. التحقق من أن كل البيانات موجودة
  if (!name || !dateOfBirth || !gender) {
    res.status(400);
    throw new Error('الرجاء إدخال جميع بيانات الطفل');
  }

  // 3. إنشاء الطفل
  const child = await Child.create({
    name,
    dateOfBirth,
    gender,
    parent: req.user.id, // <-- الربط التلقائي بالأم
  });

  // --- (4. الخطوة السحرية: الجدولة التلقائية) ---
  if (child) {
    try {
      // (أ) جلب قائمة التطعيمات الرئيسية مرتبة
      const masterVaccines = await Vaccine.find({}).sort({ ageInMonths: 'asc' });

      // (ب) تحضير سجلات المتابعة
      const childsBirthDate = new Date(child.dateOfBirth);
      
      const scheduleToCreate = masterVaccines.map((vaccine) => {
        // (ج) حساب تاريخ الاستحقاق
        const dueDate = addMonths(childsBirthDate, vaccine.ageInMonths);

        return {
          parent: req.user.id,
          child: child._id,
          vaccine: vaccine._id,
          dueDate: dueDate,
          status: 'pending', // الحالة الافتراضية
        };
      });

      // (د) إضافة كل السجلات إلى قاعدة البيانات مرة واحدة
      if (scheduleToCreate.length > 0) {
        await ChildVaccination.insertMany(scheduleToCreate);
      }

    } catch (scheduleError) {
      // (إذا فشلت الجدولة، لا تمنع إنشاء الطفل، لكن سجل الخطأ)
      console.error('حدث خطأ أثناء جدولة التطعيمات للطفل:', scheduleError);
      // (يمكن إرسال رسالة خطأ جزئية هنا إذا أردت)
    }
  }
  // --- (نهاية الخطوة السحرية) ---


  // 5. إرسال الرد (بيانات الطفل)
  res.status(201).json(child);
});

/**
 * @desc    جلب جميع أطفال المستخدم المسجل دخوله
 * @route   GET /api/v1/children
 * @access  Private (محمي)
 */
const getMyChildren = asyncHandler(async (req, res) => {
  const children = await Child.find({ parent: req.user.id });
  res.status(200).json(children);
});

/**
 * @desc    تعديل بيانات طفل
 * @route   PUT /api/v1/children/:id
 * @access  Private (محمي)
 */
const updateChild = asyncHandler(async (req, res) => {
  const child = await Child.findById(req.params.id);

  if (!child) {
    res.status(404);
    throw new Error('لم يتم العثور على الطفل');
  }

  // التحقق من أن المستخدم المسجل دخوله هو "والد" هذا الطفل
  if (child.parent.toString() !== req.user.id) {
    res.status(401); 
    throw new Error('غير مصرح لك، هذا الطفل لا يخصك');
  }

  const updatedChild = await Child.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(updatedChild);
});

/**
 * @desc    حذف طفل
 * @route   DELETE /api/v1/children/:id
 * @access  Private (محمي)
 */
const deleteChild = asyncHandler(async (req, res) => {
  const child = await Child.findById(req.params.id);

  if (!child) {
    res.status(404);
    throw new Error('لم يتم العثور على الطفل');
  }

  // التحقق من أن المستخدم هو "الوالد"
  if (child.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك، هذا الطفل لا يخصك');
  }

  await Child.findByIdAndDelete(req.params.id);

  // (ملاحظة: لاحقاً سنحتاج أيضاً لحذف كل التطعيمات المرتبطة بهذا الطفل)

  res.status(200).json({ 
    success: true, 
    message: 'تم حذف الطفل بنجاح', 
    id: req.params.id 
  });
});


// 4. تحديث سطر "module.exports"
module.exports = {
  addChild,
  getMyChildren,
  updateChild,
  deleteChild,
};
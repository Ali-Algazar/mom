// controllers/childController.js

const Child = require('../models/childModel');
const User = require('../models/userModel');
const ChildVaccination = require('../models/childVaccinationModel');
const Vaccine = require('../models/vaccineModel');
const asyncHandler = require('express-async-handler');

// --- دالة مساعدة (Helper Function) لجدولة التطعيمات ---
// دي الوظيفة اللي بتشتغل في الخلفية لما نضيف طفل جديد
const scheduleVaccinesForChild = async (child) => {
  try {
    // 1. نجيب كل التطعيمات الأساسية من السيستم
    const allVaccines = await Vaccine.find({});

    if (allVaccines.length === 0) {
      console.log('⚠️ لا توجد تطعيمات مسجلة في النظام لجدولتها.');
      return;
    }

    // 2. نجهز قائمة التطعيمات للطفل ده
    const vaccinationRecords = allVaccines.map((vaccine) => {
      // حساب تاريخ الاستحقاق: تاريخ الميلاد + عدد الشهور
      const dueDate = new Date(child.dateOfBirth);
      dueDate.setMonth(dueDate.getMonth() + vaccine.ageInMonths);

      return {
        child: child._id,
        vaccine: vaccine._id,
        vaccineName: vaccine.name, // للتسهيل في العرض
        dueDate: dueDate,
        status: 'pending', // الحالة الافتراضية
      };
    });

    // 3. حفظ الكل في قاعدة البيانات مرة واحدة (Bulk Insert)
    await ChildVaccination.insertMany(vaccinationRecords);
    console.log(`✅ تم جدولة ${vaccinationRecords.length} تطعيم للطفل ${child.name}`);

  } catch (error) {
    console.error('❌ خطأ أثناء جدولة التطعيمات:', error);
    // مش هنوقف العملية، بس هنسجل الخطأ
  }
};


/**
 * @desc    تسجيل مولود جديد (للموظفين فقط)
 * @route   POST /api/v1/children
 * @access  Private (Staff/Admin)
 */
const createChild = asyncHandler(async (req, res) => {
  // 1. التحقق إن المستخدم موظف أو أدمن (مش أم)
  if (req.user.role !== 'staff' && req.user.role !== 'super_admin') {
    res.status(403);
    throw new Error('غير مصرح لك بتسجيل مواليد. هذه وظيفة الموظف المختص.');
  }

  const { name, nationalId, dateOfBirth, gender, motherNationalId } = req.body;

  // 2. التأكد من البيانات
  if (!name || !nationalId || !dateOfBirth || !gender || !motherNationalId) {
    res.status(400);
    throw new Error('الرجاء إدخال جميع بيانات الطفل والأم');
  }

  // 3. التحقق من عدم تكرار الطفل
  const childExists = await Child.findOne({ nationalId });
  if (childExists) {
    res.status(400);
    throw new Error('هذا الطفل مسجل بالفعل (الرقم القومي مكرر)');
  }

  // 4. البحث عن حساب الأم (لربطها فوراً لو كانت مسجلة)
  const motherUser = await User.findOne({ nationalId: motherNationalId });

  // 5. إنشاء الطفل
  const child = await Child.create({
    name,
    nationalId,
    dateOfBirth,
    gender,
    motherNationalId,
    // الربط بالأم (لو موجودة)
    parentUser: motherUser ? motherUser._id : null,
    // وراثة مكان التسجيل من الموظف
    registeredAt: {
      governorate: req.user.workplace.governorate,
      city: req.user.workplace.city,
      healthUnit: req.user.workplace.healthUnit
    },
    createdBy: req.user._id
  });

  if (child) {
    // 🔥 تشغيل الجدولة التلقائية هنا 🔥
    await scheduleVaccinesForChild(child);

    res.status(201).json(child);
  } else {
    res.status(400);
    throw new Error('بيانات الطفل غير صحيحة');
  }
});

/**
 * @desc    جلب الأطفال (ذكي: للأم أو للموظف)
 * @route   GET /api/v1/children
 * @access  Private
 */
const getChildren = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'user') {
    // السيناريو 1: الأم بتطلب -> هات أطفالها هي بس
    query = { parentUser: req.user._id };
  } 
  else if (req.user.role === 'staff') {
    // السيناريو 2: الموظف بيطلب -> هات أطفال وحدته الصحية بس
    // بنجيب الأطفال اللي RegisteredAt بتاعهم مطابق لبيانات الموظف
    if (!req.user.workplace) {
        res.status(400); throw new Error('بيانات الموظف غير مكتملة (لا يوجد مكان عمل)');
    }
    query = { 
      'registeredAt.healthUnit': req.user.workplace.healthUnit,
      'registeredAt.city': req.user.workplace.city
    };
  }
  else if (req.user.role === 'super_admin') {
    // السيناريو 3: الوزارة -> هات كله
    query = {};
  }

  const children = await Child.find(query).sort({ createdAt: -1 });
  res.status(200).json(children);
});

// تصدير الدوال
module.exports = {
  createChild,
  getChildren,
};
// controllers/childController.js

const Child = require('../models/childModel');
const User = require('../models/userModel');
const ChildVaccination = require('../models/childVaccinationModel');
const Vaccine = require('../models/vaccineModel');
const asyncHandler = require('express-async-handler');

// --- دالة مساعدة (Helper Function) لجدولة التطعيمات ---
// بتشتغل أوتوماتيك لما نضيف طفل جديد
const scheduleVaccinesForChild = async (child) => {
  try {
    const allVaccines = await Vaccine.find({});

    if (allVaccines.length === 0) {
      console.log('⚠️ لا توجد تطعيمات مسجلة في النظام لجدولتها.');
      return;
    }

    const vaccinationRecords = allVaccines.map((vaccine) => {
      // حساب تاريخ الاستحقاق: تاريخ الميلاد + عدد الشهور
      const dueDate = new Date(child.dateOfBirth);
      dueDate.setMonth(dueDate.getMonth() + vaccine.ageInMonths);

      return {
        child: child._id,
        vaccine: vaccine._id,
        vaccineName: vaccine.name,
        dueDate: dueDate,
        status: 'pending',
      };
    });

    await ChildVaccination.insertMany(vaccinationRecords);
    console.log(`✅ تم جدولة ${vaccinationRecords.length} تطعيم للطفل ${child.name}`);

  } catch (error) {
    console.error('❌ خطأ أثناء جدولة التطعيمات:', error);
  }
};


/**
 * @desc    تسجيل مولود جديد (للموظفين فقط)
 * @route   POST /api/v1/children
 * @access  Private (Staff/Admin)
 */
const createChild = asyncHandler(async (req, res) => {
  // 1. التحقق إن المستخدم موظف أو أدمن
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

  // 4. البحث عن حساب الأم لربطها فوراً لو موجودة
  const motherUser = await User.findOne({ nationalId: motherNationalId });

  // 5. إنشاء الطفل مع وراثة مكان التسجيل من الموظف
  // (لو السوبر أدمن هو اللي بيضيف، لازم نتاكد ان عنده workplace او نخليه يدخله يدوي، 
  // بس هنفترض هنا ان السوبر أدمن ليه مكان او الموظف هو الاساس)
  const workplace = req.user.workplace || { governorate: 'General', city: 'General', healthUnit: 'Ministry' };

  const child = await Child.create({
    name,
    nationalId,
    dateOfBirth,
    gender,
    motherNationalId,
    parentUser: motherUser ? motherUser._id : null,
    registeredAt: {
      governorate: workplace.governorate,
      city: workplace.city,
      healthUnit: workplace.healthUnit
    },
    createdBy: req.user._id
  });

  if (child) {
    // تشغيل الجدولة التلقائية
    await scheduleVaccinesForChild(child);
    res.status(201).json(child);
  } else {
    res.status(400);
    throw new Error('بيانات الطفل غير صحيحة');
  }
});

/**
 * @desc    جلب الأطفال (ذكي: للأم، للموظف، وللوزارة مع فلترة)
 * @route   GET /api/v1/children?governorate=...&city=...
 * @access  Private
 */
const getChildren = asyncHandler(async (req, res) => {
  let query = {};

  // 1️⃣ سيناريو الأم (User): تشوف ولادها بس
  if (req.user.role === 'user') {
    query = { parentUser: req.user._id };
  } 
  
  // 2️⃣ سيناريو الموظف (Staff): يشوف أطفال وحدته الصحية بس
  else if (req.user.role === 'staff') {
    if (!req.user.workplace) {
        res.status(400); throw new Error('بيانات الموظف غير مكتملة');
    }
    query = { 
      'registeredAt.healthUnit': req.user.workplace.healthUnit,
      'registeredAt.city': req.user.workplace.city
    };
  }
  
  // 3️⃣ سيناريو الوزارة (Super Admin): يشوف كله + فلترة
  else if (req.user.role === 'super_admin') {
    query = {}; // الأساس هات كله

    // فلتر بالمحافظة
    if (req.query.governorate) {
      query['registeredAt.governorate'] = req.query.governorate;
    }
    // فلتر بالمدينة
    if (req.query.city) {
      query['registeredAt.city'] = req.query.city;
    }
    // فلتر بالوحدة الصحية
    if (req.query.healthUnit) {
      query['registeredAt.healthUnit'] = req.query.healthUnit;
    }
    // بحث بالرقم القومي للطفل
    if (req.query.nationalId) {
      query['nationalId'] = req.query.nationalId;
    }
  }

  const children = await Child.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    count: children.length,
    data: children
  });
});

module.exports = {
  createChild,
  getChildren,
};
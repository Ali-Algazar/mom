const Child = require('../models/childModel');
const User = require('../models/userModel');
const Vaccine = require('../models/vaccineModel');
const ChildVaccination = require('../models/childVaccinationModel');
const asyncHandler = require('express-async-handler');

// --- دالة مساعدة لجدولة التطعيمات (زي ما هي) ---
const scheduleVaccinesForChild = async (child) => {
  try {
    const allVaccines = await Vaccine.find({});
    if (allVaccines.length === 0) return;

    const records = allVaccines.map((vaccine) => {
      const dueDate = new Date(child.birthDate || child.dateOfBirth);
      dueDate.setMonth(dueDate.getMonth() + vaccine.ageInMonths);
      return {
        child: child._id,
        vaccine: vaccine._id,
        vaccineName: vaccine.name,
        dueDate: dueDate,
        status: 'pending',
      };
    });

    await ChildVaccination.insertMany(records);
  } catch (error) {
    console.error('❌ خطأ في الجدولة:', error);
  }
};

// ------------------------------------------------------------------

// @desc    إضافة طفل جديد (للموظفين والوزارة)
// @route   POST /api/v1/children
// @access  Private (Staff, Super Admin)
const createChild = asyncHandler(async (req, res) => {
  if (req.user.role !== 'staff' && req.user.role !== 'super_admin') {
    res.status(403); throw new Error('غير مصرح لك بإضافة مواليد');
  }

  const { name, nationalId, birthDate, gender, motherNationalId } = req.body;

  // التحقق من مكان عمل الموظف
  const staffUser = await User.findById(req.user._id).populate('workplace');
  if (req.user.role === 'staff' && !staffUser.workplace) {
      res.status(400); throw new Error('الموظف غير مرتبط بوحدة صحية');
  }

  // التأكد من عدم تكرار الطفل
  const childExists = await Child.findOne({ nationalId });
  if (childExists) { res.status(400); throw new Error('الطفل مسجل بالفعل'); }

  // البحث عن الأم لربطها (اختياري، لو موجودة نربطها)
  const motherUser = await User.findOne({ nationalId: motherNationalId });

  // تحديد موقع التسجيل
  let location = {};
  if (req.user.role === 'staff') {
      location = {
          governorate: staffUser.workplace.governorate,
          city: staffUser.workplace.district, // أو city حسب الموديل
          healthUnit: staffUser.workplace.name
      };
  } else {
      location = { governorate: 'General', city: 'General', healthUnit: 'Ministry' };
  }

  // إنشاء الطفل
  const child = await Child.create({
    name,
    nationalId,
    birthDate, // تأكد إن الاسم في الموديل birthDate أو dateOfBirth ووحدها هنا
    gender,
    motherNationalId,
    parentUser: motherUser ? motherUser._id : null, // الربط التلقائي
    registeredAt: location,
    createdBy: req.user._id
  });

  if (child) {
    await scheduleVaccinesForChild(child); // تشغيل الجدولة
    res.status(201).json(child);
  } else {
    res.status(400); throw new Error('بيانات غير صحيحة');
  }
});

// @desc    جلب أطفالي (للأمهات فقط)
// @route   GET /api/v1/children/my-children
// @access  Private (User/Mother)
const getMyChildren = asyncHandler(async (req, res) => {
    // الطريقة 1: لو مربوطة بالـ ID
    let children = await Child.find({ parentUser: req.user._id });

    // الطريقة 2: احتياطي، لو لسه ماتربطتش بالـ ID ندور بالرقم القومي
    if (children.length === 0 && req.user.nationalId) {
        children = await Child.find({ motherNationalId: req.user.nationalId });
    }

    res.status(200).json(children);
});

// @desc    جلب الأطفال (بحث وفلترة للموظفين والوزارة)
// @route   GET /api/v1/children
// @access  Private (Staff, Admin)
const getChildren = asyncHandler(async (req, res) => {
  let query = {};

  // 1. لو موظف: اجباري يقتصر البحث على وحدته الصحية فقط
  if (req.user.role === 'staff') {
    const staffUser = await User.findById(req.user._id).populate('workplace');
    if (!staffUser.workplace) { res.status(400); throw new Error('الموظف ليس له مكان عمل'); }
    
    // الفلتر الإجباري
    query['registeredAt.healthUnit'] = staffUser.workplace.name;

    // ميزات إضافية للموظف: البحث برقم قومي للأم أو للطفل داخل وحدته
    if (req.query.motherNationalId) {
        query['motherNationalId'] = req.query.motherNationalId;
    }
    if (req.query.nationalId) {
        query['nationalId'] = req.query.nationalId;
    }
  }
  
  // 2. لو وزارة (Super Admin): بحث مفتوح
  else if (req.user.role === 'super_admin') {
    // فلترة بالمحافظة
    if (req.query.governorate) query['registeredAt.governorate'] = req.query.governorate;
    // فلترة باسم الوحدة الصحية
    if (req.query.healthUnit) query['registeredAt.healthUnit'] = req.query.healthUnit;
    // بحث برقم قومي
    if (req.query.nationalId) query['nationalId'] = req.query.nationalId;
  }
  
  // حماية إضافية: لو مستخدم عادي حاول يكلم الرابط ده
  else {
      res.status(403); throw new Error('غير مصرح لك باستخدام هذا الرابط، استخدم /my-children');
  }

  const children = await Child.find(query).sort({ createdAt: -1 });
  res.status(200).json({ count: children.length, data: children });
});

// @desc    جلب طفل واحد بالـ ID
// @route   GET /api/v1/children/:id
// @access  Private
const getChildById = asyncHandler(async (req, res) => {
  const child = await Child.findById(req.params.id);

  if (!child) {
    res.status(404); throw new Error('الطفل غير موجود');
  }

  // التحقق من الصلاحيات (Authorization Logic)
  let isAuthorized = false;

  if (req.user.role === 'super_admin') {
      isAuthorized = true;
  } 
  else if (req.user.role === 'staff') {
      const staffUser = await User.findById(req.user._id).populate('workplace');
      // الموظف يشوف الطفل لو مسجل في نفس الوحدة
      if (staffUser.workplace && child.registeredAt.healthUnit === staffUser.workplace.name) {
          isAuthorized = true;
      }
  } 
  else if (req.user.role === 'user') {
      // الأم تشوف الطفل لو مربوط بحسابها
      if (child.parentUser && child.parentUser.toString() === req.user._id.toString()) {
          isAuthorized = true;
      }
      // أو لو الرقم القومي مطابق
      else if (req.user.nationalId && child.motherNationalId === req.user.nationalId) {
          isAuthorized = true;
      }
  }

  if (!isAuthorized) {
      res.status(403); throw new Error('غير مصرح لك بالاطلاع على بيانات هذا الطفل');
  }

  res.status(200).json(child);
});

// @desc    تعديل بيانات طفل
// @route   PUT /api/v1/children/:id
const updateChild = asyncHandler(async (req, res) => {
  const child = await Child.findById(req.params.id);
  if (!child) { res.status(404); throw new Error('الطفل غير موجود'); }

  // حماية التعديل
  if (req.user.role === 'staff') {
       const staffUser = await User.findById(req.user._id).populate('workplace');
       if (child.registeredAt.healthUnit !== staffUser.workplace.name) {
           res.status(403); throw new Error('لا يمكنك تعديل طفل خارج وحدتك الصحية');
       }
  } else if (req.user.role !== 'super_admin') {
      res.status(403); throw new Error('غير مصرح');
  }

  const updatedChild = await Child.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedChild);
});

// @desc    حذف طفل
// @route   DELETE /api/v1/children/:id
const deleteChild = asyncHandler(async (req, res) => {
  const child = await Child.findById(req.params.id);
  if (!child) { res.status(404); throw new Error('الطفل غير موجود'); }

  if (req.user.role !== 'super_admin') {
      res.status(403); throw new Error('الحذف مسموح للوزارة فقط');
  }

  await child.deleteOne();
  await ChildVaccination.deleteMany({ child: child._id });

  res.status(200).json({ message: 'تم حذف سجل الطفل بنجاح' });
});

module.exports = {
  createChild,
  getMyChildren, // <-- الدالة الجديدة
  getChildren,
  getChildById,
  updateChild,
  deleteChild,
};
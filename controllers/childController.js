const Child = require('../models/childModel');
const User = require('../models/userModel');
const Vaccine = require('../models/vaccineModel');
const ChildVaccination = require('../models/childVaccinationModel');
const asyncHandler = require('express-async-handler');

// ------------------------------------------------------------------
// 🛠️ دالة مساعدة لجدولة التطعيمات (Internal Helper)
// ------------------------------------------------------------------
const scheduleVaccinesForChild = async (child) => {
  try {
    const allVaccines = await Vaccine.find({});
    if (allVaccines.length === 0) return;

    // استخدام dateOfBirth لحساب المواعيد
    const birthDate = new Date(child.dateOfBirth);

    const records = allVaccines.map((vaccine) => {
      const dueDate = new Date(birthDate);
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
    console.log(`✅ تم جدولة ${records.length} تطعيم للطفل ${child.name}`);
  } catch (error) {
    console.error('❌ خطأ في الجدولة:', error);
  }
};

// ------------------------------------------------------------------
// 🎮 الدوال الأساسية (Controller Functions)
// ------------------------------------------------------------------

// @desc    إضافة طفل جديد (للموظفين والوزارة)
// @route   POST /api/v1/children
// @access  Private (Staff, Super Admin)
const createChild = asyncHandler(async (req, res) => {
  // 1. التحقق من الصلاحيات
  if (req.user.role !== 'staff' && req.user.role !== 'super_admin') {
    res.status(403); throw new Error('غير مصرح لك بإضافة مواليد');
  }

  // 2. استقبال البيانات (dateOfBirth بدلاً من birthDate)
  const { name, nationalId, dateOfBirth, gender, motherNationalId } = req.body;

  // 3. التحقق من بيانات الموظف ومكان عمله
  const staffUser = await User.findById(req.user._id).populate('workplace');
  
  if (req.user.role === 'staff' && !staffUser.workplace) {
      res.status(400); throw new Error('هذا الموظف غير مرتبط بوحدة صحية، يرجى مراجعة الأدمن');
  }

  // 4. التأكد من عدم تكرار الطفل
  const childExists = await Child.findOne({ nationalId });
  if (childExists) { res.status(400); throw new Error('هذا الطفل مسجل بالفعل'); }

  // 5. البحث عن الأم لربطها (لو ليها حساب حالياً)
  const motherUser = await User.findOne({ nationalId: motherNationalId });

  // 6. 🔥 تحديد موقع التسجيل تلقائياً (الحل النهائي لمشكلة city) 🔥
  let location = {};
  if (req.user.role === 'staff') {
      location = {
          governorate: staffUser.workplace.governorate || "غير محدد",
          // هنا الجوكر: لو ملقاش city ياخد district، لو ملقاش يكتب "غير محدد"
          city: staffUser.workplace.city || staffUser.workplace.district || "غير محدد", 
          healthUnit: staffUser.workplace.name // حفظ اسم الوحدة
      };
  } else {
      // حالة خاصة للأدمن
      location = { governorate: 'General', city: 'General', healthUnit: 'Ministry HQ' };
  }

  // 7. إنشاء الطفل في الداتابيز
  const child = await Child.create({
    name,
    nationalId,
    dateOfBirth, // ✅ لازم نفس اسم الموديل
    gender,      // ✅ لازم يكون 'boy' أو 'girl'
    motherNationalId,
    parentUser: motherUser ? motherUser._id : null, // الربط التلقائي بحساب الأم
    registeredAt: location, // ✅ تم الملء تلقائياً
    createdBy: req.user._id // ✅ تسجيل الموظف المسؤول
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
    // محاولة البحث بالـ ID المربوط
    let children = await Child.find({ parentUser: req.user._id });

    // محاولة ثانية بالرقم القومي (احتياطي)
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

  // أ. لو موظف: البحث داخل وحدته الصحية فقط
  if (req.user.role === 'staff') {
    const staffUser = await User.findById(req.user._id).populate('workplace');
    if (!staffUser.workplace) { res.status(400); throw new Error('الموظف ليس له مكان عمل'); }
    
    query['registeredAt.healthUnit'] = staffUser.workplace.name;

    // فلاتر إضافية للموظف
    if (req.query.motherNationalId) query['motherNationalId'] = req.query.motherNationalId;
    if (req.query.nationalId) query['nationalId'] = req.query.nationalId;
  }
  
  // ب. لو وزارة (Super Admin): بحث شامل
  else if (req.user.role === 'super_admin') {
    if (req.query.governorate) query['registeredAt.governorate'] = req.query.governorate;
    if (req.query.healthUnit) query['registeredAt.healthUnit'] = req.query.healthUnit;
    if (req.query.nationalId) query['nationalId'] = req.query.nationalId;
  }
  
  else {
      res.status(403); throw new Error('غير مصرح لك');
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

  // Authorization Logic (من يحق له رؤية الملف؟)
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
      // الأم تشوف ابنها
      if (child.parentUser && child.parentUser.toString() === req.user._id.toString()) {
          isAuthorized = true;
      }
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

  // حماية التعديل: الموظف يعدل أطفال وحدته فقط
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

  // الحذف للوزارة فقط
  if (req.user.role !== 'super_admin') {
      res.status(403); throw new Error('الحذف مسموح للوزارة فقط');
  }

  await child.deleteOne();
  // حذف تطعيماته أيضاً
  await ChildVaccination.deleteMany({ child: child._id });

  res.status(200).json({ message: 'تم حذف سجل الطفل بنجاح' });
});

module.exports = {
  createChild,
  getMyChildren,
  getChildren,
  getChildById,
  updateChild,
  deleteChild,
};
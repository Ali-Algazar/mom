const Child = require('../models/childModel');
const User = require('../models/userModel');
const ChildVaccination = require('../models/childVaccinationModel');
const Vaccine = require('../models/vaccineModel');
const asyncHandler = require('express-async-handler');

// --- دالة مساعدة لجدولة التطعيمات ---
const scheduleVaccinesForChild = async (child) => {
  try {
    const allVaccines = await Vaccine.find({});
    if (allVaccines.length === 0) return;

    const records = allVaccines.map((vaccine) => {
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

    await ChildVaccination.insertMany(records);
  } catch (error) {
    console.error('❌ خطأ في الجدولة:', error);
  }
};

// ------------------------------------------------------------------

// @desc    إضافة طفل جديد (للموظفين والوزارة)
// @route   POST /api/v1/children
const createChild = asyncHandler(async (req, res) => {
  if (req.user.role !== 'staff' && req.user.role !== 'super_admin') {
    res.status(403); throw new Error('غير مصرح لك بإضافة مواليد');
  }

  const { name, nationalId, dateOfBirth, gender, motherNationalId } = req.body;

  // جلب بيانات الموظف لتحديد المكان
  const staffUser = await User.findById(req.user._id).populate('workplace');
  
  if (req.user.role === 'staff' && !staffUser.workplace) {
      res.status(400); throw new Error('الموظف غير مرتبط بوحدة صحية');
  }

  const childExists = await Child.findOne({ nationalId });
  if (childExists) { res.status(400); throw new Error('الطفل مسجل بالفعل'); }

  const motherUser = await User.findOne({ nationalId: motherNationalId });

  // تحديد المكان
  let location = {};
  if (req.user.role === 'staff') {
      location = {
          governorate: staffUser.workplace.governorate,
          city: staffUser.workplace.city,
          healthUnit: staffUser.workplace.name
      };
  } else {
      location = { governorate: 'General', city: 'General', healthUnit: 'Ministry' };
  }

  const child = await Child.create({
    name, nationalId, dateOfBirth, gender, motherNationalId,
    parentUser: motherUser ? motherUser._id : null,
    registeredAt: location,
    createdBy: req.user._id
  });

  if (child) {
    await scheduleVaccinesForChild(child);
    res.status(201).json(child);
  } else {
    res.status(400); throw new Error('بيانات غير صحيحة');
  }
});

// @desc    جلب كل الأطفال (مع الفلترة)
// @route   GET /api/v1/children
const getChildren = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'user') {
    query = { parentUser: req.user._id };
  } 
  else if (req.user.role === 'staff') {
    const staffUser = await User.findById(req.user._id).populate('workplace');
    if (!staffUser.workplace) { res.status(400); throw new Error('الموظف ليس له مكان عمل'); }
    
    query = { 
      'registeredAt.healthUnit': staffUser.workplace.name,
      'registeredAt.city': staffUser.workplace.city
    };
  }
  else if (req.user.role === 'super_admin') {
    query = {};
    if (req.query.governorate) query['registeredAt.governorate'] = req.query.governorate;
    if (req.query.city) query['registeredAt.city'] = req.query.city;
    if (req.query.nationalId) query['nationalId'] = req.query.nationalId;
  }

  const children = await Child.find(query).sort({ createdAt: -1 });
  res.status(200).json({ count: children.length, data: children });
});

// @desc    جلب طفل واحد بالـ ID
// @route   GET /api/v1/children/:id
const getChildById = asyncHandler(async (req, res) => {
  const child = await Child.findById(req.params.id);

  if (!child) {
    res.status(404); throw new Error('الطفل غير موجود');
  }

  // الحماية: مين مسموح له يشوف التفاصيل؟
  // 1. الأم: لو الطفل ابنها
  // 2. الموظف: لو الطفل في وحدته
  // 3. الوزارة: تشوف أي حد

  let isAuthorized = false;

  if (req.user.role === 'super_admin') {
      isAuthorized = true;
  } 
  else if (req.user.role === 'staff') {
      const staffUser = await User.findById(req.user._id).populate('workplace');
      if (child.registeredAt.healthUnit === staffUser.workplace.name) {
          isAuthorized = true;
      }
  } 
  else if (req.user.role === 'user') {
      if (child.parentUser && child.parentUser.toString() === req.user._id.toString()) {
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

  if (!child) {
    res.status(404); throw new Error('الطفل غير موجود');
  }

  // الحماية: التعديل للموظف (في وحدته) والوزارة فقط
  if (req.user.role === 'user') {
      res.status(403); throw new Error('غير مصرح للأم بتعديل البيانات الرسمية. يرجى مراجعة الوحدة الصحية.');
  }

  if (req.user.role === 'staff') {
       const staffUser = await User.findById(req.user._id).populate('workplace');
       if (child.registeredAt.healthUnit !== staffUser.workplace.name) {
           res.status(403); throw new Error('لا يمكنك تعديل طفل مسجل في وحدة أخرى');
       }
  }

  // تنفيذ التعديل
  const updatedChild = await Child.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedChild);
});

// @desc    حذف طفل
// @route   DELETE /api/v1/children/:id
const deleteChild = asyncHandler(async (req, res) => {
  const child = await Child.findById(req.params.id);

  if (!child) {
    res.status(404); throw new Error('الطفل غير موجود');
  }

  // الحماية: الحذف للوزارة فقط (لخطورة الأمر) أو الموظف اللي سجله بس
  if (req.user.role !== 'super_admin') {
      res.status(403); throw new Error('حذف السجلات مسموح للوزارة فقط');
  }

  await child.deleteOne();
  
  // (اختياري) مسح التطعيمات المرتبطة بيه كمان عشان التنظيف
  await ChildVaccination.deleteMany({ child: child._id });

  res.status(200).json({ message: 'تم حذف سجل الطفل بنجاح' });
});

module.exports = {
  createChild,
  getChildren,
  getChildById, // رجعت اهي
  updateChild,  // رجعت اهي
  deleteChild,  // رجعت اهي
};
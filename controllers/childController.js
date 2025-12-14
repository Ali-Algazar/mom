const Child = require('../models/childModel');
const User = require('../models/userModel');
const ChildVaccination = require('../models/childVaccinationModel');
const Vaccine = require('../models/vaccineModel');
const asyncHandler = require('express-async-handler');

// ... (دالة scheduleVaccinesForChild زي ما هي) ...
const scheduleVaccinesForChild = async (child) => {
    // (انسخ الكود القديم هنا)
    try {
        const allVaccines = await Vaccine.find({});
        if (allVaccines.length === 0) return;
        const records = allVaccines.map(v => ({
            child: child._id, vaccine: v._id, vaccineName: v.name,
            dueDate: new Date(new Date(child.dateOfBirth).setMonth(new Date(child.dateOfBirth).getMonth() + v.ageInMonths)),
            status: 'pending'
        }));
        await ChildVaccination.insertMany(records);
    } catch (e) { console.error(e); }
};

// 🔥 تعديل إضافة الطفل 🔥
const createChild = asyncHandler(async (req, res) => {
  if (req.user.role !== 'staff' && req.user.role !== 'super_admin') {
    res.status(403); throw new Error('غير مصرح');
  }

  const { name, nationalId, dateOfBirth, gender, motherNationalId } = req.body;

  // لازم نجيب بيانات الموظف كاملة مع مكان عمله عشان نعرف ننسخ العنوان للطفل
  const staffUser = await User.findById(req.user._id).populate('workplace');

  // تحقق أمني: هل الموظف مرتبط بوحدة صحية؟
  if (req.user.role === 'staff' && !staffUser.workplace) {
      res.status(400); throw new Error('هذا الموظف غير مرتبط بوحدة صحية! راجع الأدمن.');
  }

  const childExists = await Child.findOne({ nationalId });
  if (childExists) { res.status(400); throw new Error('الطفل مسجل بالفعل'); }

  const motherUser = await User.findOne({ nationalId: motherNationalId });

  // تجهيز بيانات المكان للطفل
  let registrationLocation = {};
  
  if (req.user.role === 'staff') {
      // لو موظف، خد بيانات وحدته
      registrationLocation = {
          governorate: staffUser.workplace.governorate,
          city: staffUser.workplace.city,
          healthUnit: staffUser.workplace.name
      };
  } else {
      // لو سوبر أدمن (حالة نادرة)، حط قيم افتراضية
      registrationLocation = { governorate: 'General', city: 'Ministry', healthUnit: 'Central' };
  }

  const child = await Child.create({
    name, nationalId, dateOfBirth, gender, motherNationalId,
    parentUser: motherUser ? motherUser._id : null,
    registeredAt: registrationLocation, // 🔥 تم النسخ بنجاح
    createdBy: req.user._id
  });

  if (child) {
    await scheduleVaccinesForChild(child);
    res.status(201).json(child);
  } else {
    res.status(400); throw new Error('بيانات غير صحيحة');
  }
});

// 🔥 تعديل جلب الأطفال 🔥
const getChildren = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'user') {
    query = { parentUser: req.user._id };
  } 
  else if (req.user.role === 'staff') {
    // لازم نجيب بيانات الموظف عشان نعرف هو في انهي وحدة
    const staffUser = await User.findById(req.user._id).populate('workplace');
    if (!staffUser.workplace) {
        res.status(400); throw new Error('الموظف غير معين في وحدة');
    }
    // الفلترة باسم الوحدة والمدينة
    query = { 
      'registeredAt.healthUnit': staffUser.workplace.name,
      'registeredAt.city': staffUser.workplace.city
    };
  }
  else if (req.user.role === 'super_admin') {
    query = {};
    if (req.query.governorate) query['registeredAt.governorate'] = req.query.governorate;
    if (req.query.city) query['registeredAt.city'] = req.query.city;
    if (req.query.healthUnit) query['registeredAt.healthUnit'] = req.query.healthUnit;
    if (req.query.nationalId) query['nationalId'] = req.query.nationalId;
  }

  const children = await Child.find(query).sort({ createdAt: -1 });
  res.status(200).json({ count: children.length, data: children });
});

module.exports = { createChild, getChildren };
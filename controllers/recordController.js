const ChildVaccination = require('../models/childVaccinationModel');
const Child = require('../models/childModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');

// @desc    جلب جدول تطعيمات طفل معين
// @route   GET /api/v1/records/child/:childId
// @access  Private (Staff & User)
const getChildSchedule = asyncHandler(async (req, res) => {
  const childId = req.params.childId;

  // 1. التأكد إن الطفل موجود
  const child = await Child.findById(childId);
  if (!child) {
    res.status(404); throw new Error('الطفل غير موجود');
  }

  // 2. الحماية: مين مسموح له يشوف الجدول؟
  let isAuthorized = false;

  if (req.user.role === 'super_admin') {
      isAuthorized = true;
  } 
  else if (req.user.role === 'user') {
      // الأم تشوف ابنها بس
      if (child.parentUser && child.parentUser.toString() === req.user._id.toString()) {
          isAuthorized = true;
      }
  } 
  else if (req.user.role === 'staff') {
      // الموظف يشوف الطفل لو في وحدته
      const staffUser = await User.findById(req.user._id).populate('workplace');
      if (staffUser.workplace && child.registeredAt.healthUnit === staffUser.workplace.name) {
          isAuthorized = true;
      }
  }

  if (!isAuthorized) {
      res.status(403); throw new Error('غير مصرح لك بالاطلاع على هذا الجدول');
  }

  // 3. جلب التطعيمات مرتبة بالتاريخ
  const records = await ChildVaccination.find({ child: childId })
    .populate('vaccine', 'description mandatory') // هات تفاصيل التطعيم (إجباري ولا لأ)
    .sort({ dueDate: 1 });

  res.status(200).json(records);
});

// @desc    تسجيل إعطاء التطعيم (تغيير الحالة إلى Completed)
// @route   PUT /api/v1/records/:id
// @access  Private (Staff Only)
const markAsTaken = asyncHandler(async (req, res) => {
  const recordId = req.params.id; // ده الـ ID بتاع السجل (ChildVaccination)

  // 1. البحث عن السجل
  const record = await ChildVaccination.findById(recordId).populate('child');
  if (!record) {
    res.status(404); throw new Error('سجل التطعيم غير موجود');
  }

  // 2. حماية: الموظف بس هو اللي يطعم (أو الوزارة)
  if (req.user.role !== 'staff' && req.user.role !== 'super_admin') {
      res.status(403); throw new Error('الموظف المختص فقط يمكنه تأكيد التطعيم');
  }

  // 3. (اختياري) حماية إضافية: هل الموظف في نفس وحدة الطفل؟
  if (req.user.role === 'staff') {
      const staffUser = await User.findById(req.user._id).populate('workplace');
      // لو الطفل مسجل في وحدة تانية، طلع تحذير (أو اسمح بيها كحالة طوارئ حسب رغبتك)
      if (record.child.registeredAt.healthUnit !== staffUser.workplace.name) {
         // res.status(403); throw new Error('هذا الطفل تابع لوحدة صحية أخرى');
         // ملحوظة: عادة في الصحة بيسمحوا بالتطعيم في أي مكان، فممكن تشيل الشرط ده.
      }
  }

  // 4. التحديث
  record.status = 'completed';
  record.dateAdministered = Date.now();
  
  await record.save();

  res.status(200).json({
      message: 'تم تسجيل التطعيم بنجاح ✅',
      data: record
  });
});

// @desc    إلغاء التطعيم (لو الموظف غلط)
// @route   PUT /api/v1/records/:id/undo
const undoVaccination = asyncHandler(async (req, res) => {
    const record = await ChildVaccination.findById(req.params.id);
    if (!record) { res.status(404); throw new Error('غير موجود'); }
    
    // حماية للأدمن والموظف فقط
    if (req.user.role !== 'staff' && req.user.role !== 'super_admin') {
        res.status(403); throw new Error('غير مصرح');
    }

    record.status = 'pending';
    record.dateAdministered = null;
    await record.save();
    
    res.status(200).json(record);
});

module.exports = {
  getChildSchedule,
  markAsTaken,
  undoVaccination
};
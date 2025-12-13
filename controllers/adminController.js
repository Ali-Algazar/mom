const User = require('../models/userModel');
const Child = require('../models/childModel');
const ChildVaccination = require('../models/childVaccinationModel');
const asyncHandler = require('express-async-handler');

// @desc    إحصائيات عامة (للوحة التحكم)
const getDashboardStats = asyncHandler(async (req, res) => {
  const usersCount = await User.countDocuments({ role: 'user' });
  const childrenCount = await Child.countDocuments({});
  const staffCount = await User.countDocuments({ role: 'staff' });
  
  res.status(200).json({
    users: usersCount,
    children: childrenCount,
    staff: staffCount
  });
});

// @desc    قائمة المتخلفين عن التطعيم (أكثر من 14 يوم)
// @route   GET /api/v1/admin/defaulters
const getDefaulters = asyncHandler(async (req, res) => {
    // 1. تحديد التاريخ (من أسبوعين فاتوا)
    const today = new Date();
    const deadline = new Date(today);
    deadline.setDate(today.getDate() - 14);

    // 2. البحث عن التطعيمات المتأخرة
    const overdueRecords = await ChildVaccination.find({
        status: 'pending',
        dueDate: { $lte: deadline }
    })
    .populate('child', 'name nationalId motherNationalId') // هات بيانات الطفل
    .populate({
        path: 'child',
        populate: { path: 'parentUser', select: 'name email phone' } // هات بيانات الأم للتواصل
    });

    // 3. (اختياري) فلترة حسب وحدة الموظف لو اللي طالب موظف
    let results = overdueRecords;
    if (req.user.role === 'staff') {
        results = overdueRecords.filter(record => 
            record.child && 
            record.child.registeredAt &&
            record.child.registeredAt.healthUnit === req.user.workplace.healthUnit
        );
    }

    res.status(200).json({
        count: results.length,
        data: results
    });
});

// @desc    توقع احتياجات التطعيمات (للشهر القادم)
// @route   GET /api/v1/admin/forecast
const getVaccineNeedsForecast = asyncHandler(async (req, res) => {
    // نفترض بنحسب للشهر الجاي
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    const needs = await ChildVaccination.aggregate([
        {
            $match: {
                dueDate: { $gte: nextMonth, $lte: endNextMonth },
                status: 'pending'
            }
        },
        {
            $group: {
                _id: '$vaccineName',
                requiredDoses: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({
        period: `${nextMonth.getMonth() + 1}/${nextMonth.getFullYear()}`,
        forecast: needs
    });
});

// @desc    جلب كل المستخدمين (للوزارة)
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.status(200).json(users);
});

module.exports = {
    getDashboardStats,
    getDefaulters,
    getVaccineNeedsForecast,
    getAllUsers
};
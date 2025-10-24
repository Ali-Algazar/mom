const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Child = require('../models/childModel');
const NotificationLog = require('../models/notificationLogModel');

/**
 * @desc    (للأدمن) جلب جميع المستخدمين
 * @route   GET /api/v1/admin/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.status(200).json(users);
});

/**
 * @desc    (للأدمن) جلب جميع الأطفال المسجلين
 * @route   GET /api/v1/admin/children
 * @access  Private/Admin
 */
const getAllChildren = asyncHandler(async (req, res) => {
  const children = await Child.find({})
    .populate('parent', 'name email');
  res.status(200).json(children);
});

/**
 * @desc    (للأدمن) جلب سجلات إرسال الإشعارات
 * @route   GET /api/v1/admin/notifications/logs
 * @access  Private/Admin
 */
const getNotificationLogs = asyncHandler(async (req, res) => {
  const logs = await NotificationLog.find({})
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);
  res.status(200).json(logs);
});


module.exports = {
  getAllUsers,
  getAllChildren,
  getNotificationLogs,
  
};
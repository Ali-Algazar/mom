// jobs/notificationScheduler.js

const { addDays, startOfDay, endOfDay } = require('date-fns');
const ChildVaccination = require('../models/childVaccinationModel');
const admin = require('../config/firebaseAdmin'); // استيراد admin
const NotificationLog = require('../models/notificationLogModel');
const mongoose = require('mongoose');

// --- (دي بقت مجرد وظيفة عادية بيتم استدعائها) ---
const sendVaccinationReminders = async () => {
  console.log('--- [Manual Trigger / Vercel Cron]: بدء مهمة الإشعارات ---');

  let messagingService;
  try {
      if (admin && admin.messaging) {
          messagingService = admin.messaging();
      }
  } catch (initError) {
       console.error('[Scheduler] خطأ في الحصول على خدمة المراسلة:', initError);
  }

  if (!messagingService) {
      console.error('--- [Manual Trigger / Vercel Cron]: خدمة مراسلة Firebase غير متاحة! إلغاء المهمة. ---');
      return { success: false, message: 'خدمة المراسلة غير متاحة' }; // إرجاع الحالة
  }

  if (mongoose.connection.readyState !== 1) {
    console.error('--- [Manual Trigger / Vercel Cron]: قاعدة البيانات غير متصلة! إلغاء المهمة. ---');
    return { success: false, message: 'قاعدة البيانات غير متاحة' }; // إرجاع الحالة
  }

  const targetDate = addDays(new Date(), 3);
  const targetStart = startOfDay(targetDate);
  const targetEnd = endOfDay(targetDate);
  let successCount = 0;
  let failureCount = 0;
  let noTokenCount = 0;

  try {
    const upcomingVaccinations = await ChildVaccination.find({
      dueDate: { $gte: targetStart, $lte: targetEnd },
      status: 'pending',
    })
      .populate('parent', 'fcmToken name _id')
      .populate('child', 'name')
      .populate('vaccine', 'name');

    if (!upcomingVaccinations || upcomingVaccinations.length === 0) {
      console.log('--- [Manual Trigger / Vercel Cron]: لا توجد تطعيمات قادمة. ---');
      return { success: true, message: 'لا توجد إشعارات لإرسالها اليوم.' }; // إرجاع الحالة
    }
    console.log(`--- [Manual Trigger / Vercel Cron]: تم العثور على ${upcomingVaccinations.length} تطعيم قادم ---`);

    for (const job of upcomingVaccinations) {
      if (job.parent && job.parent.fcmToken) {
        const message = {
          notification: {
            title: 'تذكير بموعد تطعيم 💉',
            body: `مرحباً ${job.parent.name}، هذا تذكير بأن موعد تطعيم "${job.vaccine.name}" لطفلك "${job.child.name}" بعد 3 أيام.`,
          },
          token: job.parent.fcmToken,
        };

        try {
          await messagingService.send(message);
          console.log(`✅ تم إرسال الإشعار بنجاح إلى ${job.parent.name}`);
          successCount++;
          await NotificationLog.create({
            user: job.parent._id, status: 'success', notificationTitle: message.notification.title, notificationBody: message.notification.body,
          });
        } catch (error) {
          console.error(`❌ فشل إرسال الإشعار إلى ${job.parent.name}:`, error.message);
          failureCount++;
          await NotificationLog.create({
            user: job.parent._id, status: 'failed', errorMessage: error.message, notificationTitle: message.notification.title, notificationBody: message.notification.body,
          });
        }
      } else {
         if(job.parent) {
             noTokenCount++;
             await NotificationLog.create({
                 user: job.parent._id, status: 'failed', errorMessage: 'User does not have an FCM token registered.', notificationTitle: 'تذكير بموعد تطعيم 💉', notificationBody: `تذكير بتطعيم "${job.vaccine.name}" لطفلك "${job.child.name}"`,
             });
         }
      }
    }
     return { success: true, message: `انتهت المهمة. نجاح: ${successCount}, فشل: ${failureCount}, بدون توكن: ${noTokenCount}` }; // إرجاع الحالة

  } catch (error) {
    console.error('--- [Manual Trigger / Vercel Cron]: خطأ فادح في مهمة الإشعارات ---', error);
     return { success: false, message: `خطأ فادح: ${error.message}` }; // إرجاع الحالة
  }
};

// --- (تم حذف cron.schedule) ---

// --- تصدير الوظيفة عشان الـ API يقدر ينادي عليها ---
module.exports = { sendVaccinationReminders };
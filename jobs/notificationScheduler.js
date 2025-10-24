// jobs/notificationScheduler.js

const cron = require('node-cron');
const { addDays, startOfDay, endOfDay } = require('date-fns');
const ChildVaccination = require('../models/childVaccinationModel');
// --- (1. استيراد كائن admin الرئيسي من الكونفيج) ---
const admin = require('../config/firebaseAdmin');
const NotificationLog = require('../models/notificationLogModel');
const mongoose = require('mongoose');

const sendVaccinationReminders = async () => {
  console.log('--- [Cron Job]: بدء مهمة البحث عن تذكيرات التطعيمات ---');

  // --- (2. التأكد إن خدمة المراسلة موجودة) ---
  if (!admin || !admin.messaging) {
      console.error('--- [Cron Job]: Firebase Admin or Messaging service is not initialized! Skipping job. ---');
      return;
  }

  if (mongoose.connection.readyState !== 1) {
    console.error('--- [Cron Job]: فشل الاتصال بقاعدة البيانات قبل بدء المهمة ---');
    return;
  }

  const targetDate = addDays(new Date(), 3);
  const targetStart = startOfDay(targetDate);
  const targetEnd = endOfDay(targetDate);

  try {
    const upcomingVaccinations = await ChildVaccination.find({
      dueDate: { $gte: targetStart, $lte: targetEnd },
      status: 'pending',
    })
      .populate('parent', 'fcmToken name _id')
      .populate('child', 'name')
      .populate('vaccine', 'name');

    if (!upcomingVaccinations || upcomingVaccinations.length === 0) {
      console.log('--- [Cron Job]: لا توجد تطعيمات لإرسال إشعارات لها اليوم ---');
      return;
    }
    console.log(`--- [Cron Job]: تم العثور على ${upcomingVaccinations.length} تطعيم مستحق ---`);

    for (const job of upcomingVaccinations) {
      if (job.parent && job.parent.fcmToken) {
        const message = {
          notification: {
            title: 'تذكير بموعد تطعيم 💉',
            body: `مرحباً ${job.parent.name}، هذا تذكير بأن موعد تطعيم "${job.vaccine.name}" لطفلك "${job.child.name}" بعد 3 أيام.`,
          },
          token: job.parent.fcmToken, // Note: Use 'token' for send
        };

        try {
          // --- (3. استخدام admin.messaging().send() مباشرة) ---
          await admin.messaging().send(message);
          console.log(`✅ تم إرسال إشعار إلى ${job.parent.name} بنجاح`);
          await NotificationLog.create({
            user: job.parent._id,
            status: 'success',
            notificationTitle: message.notification.title,
            notificationBody: message.notification.body,
          });
        } catch (error) {
          console.error(`❌ فشل إرسال الإشعار إلى ${job.parent.name}:`, error.message);
          await NotificationLog.create({
            user: job.parent._id,
            status: 'failed',
            errorMessage: error.message,
            notificationTitle: message.notification.title,
            notificationBody: message.notification.body,
          });
        }
      } else {
         if(job.parent) {
             await NotificationLog.create({
                 user: job.parent._id,
                 status: 'failed',
                 errorMessage: 'User does not have an FCM token registered.',
                 notificationTitle: 'تذكير بموعد تطعيم 💉',
                 notificationBody: `تذكير بتطعيم "${job.vaccine.name}" لطفلك "${job.child.name}"`,
             });
         }
      }
    }
  } catch (error) {
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
        console.error('--- [Cron Job]: فشل الاتصال بقاعدة البيانات أثناء البحث ---', error.message);
    } else {
        console.error('--- [Cron Job]: حدث خطأ فادح في مهمة الإشعارات ---', error);
    }
  }
};

cron.schedule('0 9 * * *', () => { // (تأكد أن هذا هو التوقيت الذي تريده)
  sendVaccinationReminders();
}); // (بدون خيار المنطقة الزمنية)

console.log('⏰ تم جدولة "ساعي البريد" (الإشعارات) ليعمل كل يوم الساعة 9 صباحاً مع تسجيل الحالة');

module.exports = { sendVaccinationReminders };
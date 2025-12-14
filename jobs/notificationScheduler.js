const { addDays, startOfDay, endOfDay } = require('date-fns');
const ChildVaccination = require('../models/childVaccinationModel');
const admin = require('../config/firebaseAdmin');
const NotificationLog = require('../models/notificationLogModel');
const mongoose = require('mongoose');

const sendVaccinationReminders = async () => {
  console.log('--- 🔔 بدء مهمة إرسال الإشعارات ---');

  // 1. التحقق من اتصال Firebase
  let messagingService;
  try {
      if (admin && admin.messaging) {
          messagingService = admin.messaging();
      }
  } catch (initError) {
       console.error('❌ خطأ في تهيئة Firebase:', initError);
       return { success: false, message: 'Firebase Error' };
  }

  if (!messagingService) {
      console.error('❌ خدمة المراسلة غير متاحة.');
      return { success: false, message: 'Messaging service unavailable' };
  }

  // 2. تحديد التاريخ المستهدف (بعد 3 أيام من الآن)
  const targetDate = addDays(new Date(), 3);
  const targetStart = startOfDay(targetDate);
  const targetEnd = endOfDay(targetDate);

  let successCount = 0;
  let failureCount = 0;
  let noTokenCount = 0;

  try {
    // 3. البحث عن التطعيمات المستحقة
    const upcomingVaccinations = await ChildVaccination.find({
      dueDate: { $gte: targetStart, $lte: targetEnd },
      status: 'pending',
    })
      // 🔥 التعديل هنا: Populate متداخل عشان نجيب الأم من خلال الطفل 🔥
      .populate({
          path: 'child',
          select: 'name parentUser', // هات اسم الطفل والـ ID بتاع الأم
          populate: {
              path: 'parentUser', // ادخل جوا الأم
              select: 'name fcmToken' // وهات اسمها والتوكن
          }
      })
      .populate('vaccine', 'name'); // هات اسم التطعيم

    if (!upcomingVaccinations || upcomingVaccinations.length === 0) {
      console.log('ℹ️ لا توجد تطعيمات مستحقة بعد 3 أيام.');
      return { success: true, message: 'No vaccinations found' };
    }

    console.log(`📊 تم العثور على ${upcomingVaccinations.length} تطعيم مستحق.`);

    // 4. إرسال الإشعارات
    for (const job of upcomingVaccinations) {
      // الوصول للأم اختلف: بقى عن طريق job.child.parentUser
      const parent = job.child ? job.child.parentUser : null;

      if (parent && parent.fcmToken) {
        const message = {
          notification: {
            title: 'تذكير بموعد التطعيم 💉',
            body: `مرحباً ${parent.name}، تذكير بموعد تطعيم "${job.vaccineName || job.vaccine.name}" للطفل "${job.child.name}" بعد 3 أيام.`,
          },
          token: parent.fcmToken,
        };

        try {
          await messagingService.send(message);
          console.log(`✅ تم الإرسال إلى: ${parent.name}`);
          successCount++;
          
          // تسجيل في اللوج
          await NotificationLog.create({
            user: parent._id,
            status: 'success',
            notificationTitle: message.notification.title,
            notificationBody: message.notification.body,
          });

        } catch (error) {
          console.error(`❌ فشل الإرسال إلى ${parent.name}:`, error.message);
          failureCount++;
          
          await NotificationLog.create({
            user: parent._id,
            status: 'failed',
            errorMessage: error.message,
            notificationTitle: message.notification.title,
            notificationBody: message.notification.body,
          });
        }
      } else {
         noTokenCount++;
         // لو الأم ملهاش توكن، ممكن نسجل ده عشان نعرف إنها مش هتستلم إشعار
         if(parent) {
             console.log(`⚠️ المستخدم ${parent.name} ليس لديه FCM Token.`);
         }
      }
    }

    return { 
        success: true, 
        message: `التقرير: نجاح (${successCount}) - فشل (${failureCount}) - بدون توكن (${noTokenCount})` 
    };

  } catch (error) {
    console.error('❌ خطأ فادح في السكيدولر:', error);
    return { success: false, message: error.message };
  }
};

module.exports = { sendVaccinationReminders };
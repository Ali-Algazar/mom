// index.js (الملف الرئيسي)

const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const cors = require('cors');
const helmet = require('helmet');

dotenv.config();
connectDB(); // الاتصال بقاعدة البيانات
require('./jobs/notificationScheduler'); // تشغيل ساعي البريد

const app = express();
const PORT = process.env.PORT || 3000; // <-- غير السطر ده

// --- Middlewares الأساسية ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// --- استيراد ملفات المسارات (Routes) ---
const mainRoutes = require('./routes/mainRoutes');
const authRoutes = require('./routes/authRoutes');
const childRoutes = require('./routes/childRoutes');
const vaccineRoutes = require('./routes/vaccineRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const articleRoutes = require('./routes/articleRoutes');
const growthRoutes = require('./routes/growthRoutes');
const dailyLogRoutes = require('./routes/dailyLogRoutes');
const diaryEntryRoutes = require('./routes/diaryEntryRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const faqRoutes = require('./routes/faqRoutes');
const adminRoutes = require('./routes/adminRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const soundRoutes = require('./routes/soundRoutes');
const postRoutes = require('./routes/postRoutes'); // <-- (1. استيراد جديد)
const commentRoutes = require('./routes/commentRoutes'); // <-- (2. استيراد جديد)

// --- استخدام المسارات (Mounting Routes) ---
app.use('/', mainRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/children', childRoutes);
app.use('/api/v1/vaccines', vaccineRoutes);
app.use('/api/v1/schedule', scheduleRoutes);
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/growth', growthRoutes);
app.use('/api/v1/logs', dailyLogRoutes);
app.use('/api/v1/diary', diaryEntryRoutes);
app.use('/api/v1/medicines', medicineRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/faqs', faqRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/sounds', soundRoutes);
app.use('/api/v1/posts', postRoutes); // <-- (3. استخدام مسار البوستات)
app.use('/api/v1/comments', commentRoutes); // <-- (4. استخدام مسار الكومنتات)

// --- معالجات الأخطاء (تكون في النهاية) ---
app.use(notFound);
app.use(errorHandler);

// --- تشغيل السيرفر ---
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل الآن بهيكلة احترافية على http://localhost:${PORT}`);
});
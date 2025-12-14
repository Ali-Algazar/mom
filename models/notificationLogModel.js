const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        required: true
    },
    notificationTitle: String,
    notificationBody: String,
    errorMessage: String, // لتخزين سبب الفشل لو حصل
}, { timestamps: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
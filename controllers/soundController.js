const Sound = require('../models/soundModel');
const asyncHandler = require('express-async-handler');

const getSounds = asyncHandler(async (req, res) => {
  const sounds = await Sound.find({});
  res.status(200).json(sounds);
});

const addSound = asyncHandler(async (req, res) => {
  const sound = await Sound.create(req.body);
  res.status(201).json(sound);
});

const deleteSound = asyncHandler(async (req, res) => {
  const sound = await Sound.findById(req.params.id);
  if (!sound) { res.status(404); throw new Error('الصوت غير موجود'); }
  await sound.deleteOne();
  res.status(200).json({ message: 'تم الحذف' });
});

module.exports = {
  getSounds,
  addSound,
  deleteSound
};
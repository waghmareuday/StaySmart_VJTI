const express =require('express');
const Feedback =require('../models/Feedback'); // Feedback model
const AuthModel = require('../models/AuthModel');
const router = express.Router();
const MessFeedback=require('../models/MessFeedback')
const { verifyUserToken, requireStudent } = require('../middleware/auth');

router.use(verifyUserToken, requireStudent);

const getAuthenticatedStudentProfile = async (req) => {
  if (!req.user?.id) return null;
  return AuthModel.findById(req.user.id)
    .select('name email')
    .lean();
};


router.post('/hostel', async (req, res) => {
  try {
    const profile = await getAuthenticatedStudentProfile(req);
    const { feedback, rating } = req.body;

    const numericRating = Number(rating);
    if (!feedback || !Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Feedback and rating (1-5) are required.' });
    }

    if (!profile?.name || !profile?.email) {
      return res.status(400).json({ message: 'Unable to resolve authenticated student profile.' });
    }

    const newFeedback = new Feedback({
      name: profile.name,
      email: profile.email,
      feedback,
      rating: numericRating,
    });

    await newFeedback.save();

    res.status(200).json({ message: 'Feedback submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});
router.post('/mess', async (req, res) => {
  try {
    const profile = await getAuthenticatedStudentProfile(req);
    const { feedback, rating } = req.body;

    const numericRating = Number(rating);
    if (!feedback || !Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Feedback and rating (1-5) are required.' });
    }

    if (!profile?.name || !profile?.email) {
      return res.status(400).json({ message: 'Unable to resolve authenticated student profile.' });
    }

    const newFeedback = new MessFeedback({
      name: profile.name,
      email: profile.email,
      feedback,
      rating: numericRating,
    });

    await newFeedback.save();

    res.status(200).json({ message: 'Feedback submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

module.exports= router;

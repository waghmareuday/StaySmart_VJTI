const express =require('express');
const Feedback =require('../models/Feedback'); // Feedback model
const router = express.Router();
const MessFeedback=require('../models/MessFeedback')


router.post('/hostel', async (req, res) => {
  try {
    const { name, email, feedback, rating } = req.body;

    const newFeedback = new Feedback({
      name,
      email,
      feedback,
      rating,
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
    const { name, email, feedback, rating } = req.body;

    const newFeedback = new MessFeedback({
      name,
      email,
      feedback,
      rating,
    });

    await newFeedback.save();

    res.status(200).json({ message: 'Feedback submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

module.exports= router;

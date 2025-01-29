const express =require('express');
const LostnFound = require('../models/LostnFound'); 
const router = express.Router();


router.post('/', async (req, res) => {
  try {
    const { itemType, itemName, description, location, contact, imageURL } = req.body;

    const newLostnFound = new LostnFound({
        itemType,
        itemName,
        description,
        location,
        contact,
        imageURL
    });

    await newLostnFound.save();

    res.status(200).json({ message: 'Feedback submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

module.exports= router;
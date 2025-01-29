const express =require('express');
const HostelAllotment =require('../models/HostelAllotment'); // HostelAllotment model
const router = express.Router();


router.post('/', async (req, res) => {
  try {
    const { fullName, rollNumber, department, roomType, arrivalDate, contact, reason } = req.body;
    console.log(req.body);
    const newHostelAllotment = new HostelAllotment({
        fullName, rollNumber, department, roomType, arrivalDate, contact, reason
    });

    await newHostelAllotment.save();

    res.status(200).json({ message: 'Allotment Form submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

module.exports= router;

const express = require('express');
const router = express.Router();
const messoff = require('../models/Messoff');
const hostelfeedback = require('../models/Feedback');
const messfeedback = require('../models/MessFeedback');
const Complaint = require('../models/Complaint');  // Add the missing model import
const HostelAllotment = require('../models/HostelAllotment');  // Add the missing model import
const AuthModel = require('../models/AuthModel')

// Route to fetch mess off data
router.get('/messoff', async (req, res) => {
  try {
    const messoff1 = await messoff.find();
    if (!messoff1) {
      return res.send({ message: 'No Data Found' });
    }
    res.send({ message: 'Data Fetched', messoff: messoff1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/getTotalCount',async (req, res) => {
  try {
    const totalCountStudents = await AuthModel.countDocuments();
    const totalComplaint = await Complaint.countDocuments();
    const HostelAllotted = await HostelAllotment.find({alloted:true});
    if (!HostelAllotted) {
      return res.send({ message: 'No Data Found' });
    } 
    const HostelNotAllotted = await HostelAllotment.find({alloted:false});
    
    res.send({ totalComplaint, totalCountStudents, HostelAllotted:HostelAllotted.length, HostelNotAllotted:HostelNotAllotted.length });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
})
// Route to fetch hostel feedback data
router.get('/hostelfeedback', async (req, res) => {
  try {
    const hostelfeedback1 = await hostelfeedback.find();
    if (!hostelfeedback1) {
      return res.send({ message: 'No Data Found' });
    }
    res.send({ message: 'Data Fetched', hostelfeedback: hostelfeedback1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch mess feedback data
router.get('/messfeedback', async (req, res) => {
  try {
    const messfeedback1 = await messfeedback.find();
    if (!messfeedback1) {
      return res.send({ message: 'No Data Found' });
    }
    res.send({ message: 'Data Fetched', messfeedback: messfeedback1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch complaints data
router.get('/Complaint', async (req, res) => {
  try {
    const Complaint1 = await Complaint.find();
    if (!Complaint1) {
      return res.send({ message: 'No Data Found' });
    }
    res.send({ message: 'Data Fetched', Complaint: Complaint1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to fetch hostel allotment data
router.get('/HostelAllotment', async (req, res) => {
  try {
    const HostelAllotment1 = await HostelAllotment.find();
    if (!HostelAllotment1) {
      return res.send({ message: 'No Data Found' });
    }
    res.send({ message: 'Data Fetched', HostelAllotment: HostelAllotment1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to toggle the allotment status of a hostel
router.post('/toggle-allotment/:id', async (req, res) => {
  try {
    const allotment = await HostelAllotment.findById(req.params.id);
    if (!allotment) {
      return res.status(404).json({ message: 'Allotment not found' });
    }
    allotment.alloted = !allotment.alloted;
    await allotment.save();
    res.json({ message: 'Allotment status updated', alloted: allotment.alloted });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;

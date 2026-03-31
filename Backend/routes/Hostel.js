const express=require('express');
const router=express.Router();
const HostelLeaving=require('../models/HostelLeaving');
const HostelAllotment =require('../models/HostelAllotment'); 
const LostnFound = require('../models/LostnFound'); 
const Complaint = require('../models/Complaint');
const AuthModel = require('../models/AuthModel');
const { verifyUserToken, requireStudent } = require('../middleware/auth');
const { createMessOffRequest } = require('../controllers/messBillingController');

router.use(verifyUserToken, requireStudent);

const getAuthenticatedStudentProfile = async (req) => {
  if (!req.user?.id) return null;
  return AuthModel.findById(req.user.id)
    .select('name email collegeId mobileNo roomNo')
    .lean();
};

router.post('/hostelLeaving',async (req,res)=>{
    try {
        const profile = await getAuthenticatedStudentProfile(req);
        const { name , roomNo, dateOfDeparture, contact, reason } = req.body;

        const resolvedName = String(profile?.name || name || '').trim();
        const resolvedRollNo = Number(profile?.collegeId);
        const resolvedRoomNo = String(profile?.roomNo || roomNo || '').trim();
        const resolvedContact = Number(profile?.mobileNo || contact);

        if (!resolvedName || !Number.isFinite(resolvedRollNo) || !resolvedRoomNo || !reason) {
          return res.status(400).json({ message: 'Missing required fields for hostel leaving form.' });
        }

        const departureDate = new Date(dateOfDeparture);
        if (Number.isNaN(departureDate.getTime())) {
          return res.status(400).json({ message: 'Invalid departure date.' });
        }

        if (!Number.isFinite(resolvedContact)) {
          return res.status(400).json({ message: 'A valid contact number is required.' });
        }
        
        const newHostelLeaving=new HostelLeaving({
            name: resolvedName, 
            rollNo: resolvedRollNo,
            roomNo: resolvedRoomNo,
            dateOfDeparture: departureDate,
            contact: resolvedContact,
            reason
        });

        await newHostelLeaving.save();
        res.status(200).json({ message: 'Hostel Leaving  Registration successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong. Please try again.' });
      }

})

router.post('/hostelAllotment', async (req, res) => {
    try {
      const profile = await getAuthenticatedStudentProfile(req);
      const { fullName, rollNumber, department, roomType, arrivalDate, contact, reason } = req.body;
      const resolvedName = String(profile?.name || fullName || '').trim();
      const resolvedRollNumber = String(profile?.collegeId || rollNumber || '').trim();
      const resolvedContact = Number(profile?.mobileNo || contact);
      const resolvedArrivalDate = new Date(arrivalDate);

      if (!resolvedName || !resolvedRollNumber || !department || !roomType || !reason) {
        return res.status(400).json({ message: 'Missing required allotment fields.' });
      }

      if (!Number.isFinite(resolvedContact)) {
        return res.status(400).json({ message: 'A valid contact number is required.' });
      }

      if (Number.isNaN(resolvedArrivalDate.getTime())) {
        return res.status(400).json({ message: 'Invalid arrival date.' });
      }

      console.log(req.body);
      const newHostelAllotment = new HostelAllotment({
          fullName: resolvedName,
          rollNumber: resolvedRollNumber,
          department,
          roomType,
          arrivalDate: resolvedArrivalDate,
          contact: resolvedContact,
          reason
      });
  
      await newHostelAllotment.save();
  
      res.status(200).json({ message: 'Allotment Form submitted successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
  });

router.post('/complaint', async (req, res) => {
    try {
      const profile = await getAuthenticatedStudentProfile(req);
      const { name, email, details } = req.body;

      if (!details) {
        return res.status(400).json({ message: 'Complaint details are required.' });
      }

      const resolvedName = String(profile?.name || name || '').trim();
      const resolvedEmail = String(profile?.email || email || '').trim().toLowerCase();

      if (!resolvedName || !resolvedEmail) {
        return res.status(400).json({ message: 'Unable to resolve student profile details.' });
      }
  
      const newComplaint = new Complaint({
        name: resolvedName,
        email: resolvedEmail,
        details,
      });
  
      await newComplaint.save();
      
      res.status(200).json({ message: 'Complaint submitted successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
  });

  router.post('/lostnfound', async (req, res) => {
    try {
      const profile = await getAuthenticatedStudentProfile(req);
      const { itemType, itemName, description, location, contact, imageURL } = req.body;

      const resolvedContact = String(profile?.mobileNo || contact || '').trim();

      if (!itemType || !itemName || !description || !location || !resolvedContact) {
        return res.status(400).json({ message: 'Missing required lost and found fields.' });
      }
  
      const newLostnFound = new LostnFound({
          itemType,
          itemName,
          description,
          location,
          contact: resolvedContact,
          imageURL
      });
  
      await newLostnFound.save();
      
      res.status(200).json({ message: 'Feedback submitted successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
  });


router.post('/messoff', createMessOffRequest);
  


module.exports=router;
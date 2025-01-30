const express=require('express');
const router=express.Router();
const HostelLeaving=require('../models/HostelLeaving');
const HostelAllotment =require('../models/HostelAllotment'); 
const LostnFound = require('../models/LostnFound'); 

router.post('/hostelLeaving',async (req,res)=>{
    try {
        const { name , rollNo,roomNo,dateOfDepartur,contact,reason}=req.body;
        console.log(req.body);
        
        const newHostelLeaving=new HostelLeaving({
            name , 
            rollNo,
            roomNo,
            dateOfDepartur,
            contact,
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

router.post('/lostnfound', async (req, res) => {
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





module.exports=router;
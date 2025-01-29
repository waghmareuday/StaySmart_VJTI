const express=require('express');
const HostelLeaving=require('../models/HostelLeaving');
const router=express.Router();

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


module.exports=router;
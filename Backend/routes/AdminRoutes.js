const express=require('express');
const router=express.Router();
const messoff=require('../models/Messoff')
const Complaint=require('../models/Complaint')
const HostelAllotment=require('../models/HostelAllotment')

router.get('/messoff',async (req,res)=>{

try {
      const messoff1 = await messoff.find();
      if (!messoff1 ) {
        return res.send({ message: 'No Data Found' });
      }     
      res.send({ message: 'Data Fetched', messoff:messoff1 });
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
})

router.get('/Complaint',async (req,res)=>{
try {
    const Complaint1 = await Complaint.find();
    if (!Complaint1) {
      return res.send({ message: 'No Data Found' });
    }     
    res.send({ message: 'Data Fetched', Complaint:Complaint1 });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

router.get('/HostelAllotment',async (req,res)=>{
  try {
      const HostelAllotment1 = await HostelAllotment.find();
      if (!HostelAllotment1) {
        return res.send({ message: 'No Data Found' });
      }     
      res.send({ message: 'Data Fetched', HostelAllotment:HostelAllotment1 });
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  })
  
  router.post('/toggle-allotment/:id', async (req, res) => {
    try {
      const allotment = await HostelAllotment.findById(req.params.id);
      console.log(allotment);
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

module.exports = router
const express=require('express');
const router=express.Router();
const messoff=require('../models/Messoff')
const hostelfeedback=require('../models/Feedback')
const messfeedback=require('../models/MessFeedback')

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

router.get('/hostelfeedback',async(req,res)=>{
  try{
    const hostelfeedback1=await hostelfeedback.find();
    if(!hostelfeedback1){
      return res.send("no data found")
    }
    res.send({message:"data fetched",hostelfeedback:hostelfeedback1})

  }catch (err) {
    res.status(500).json({ error: err.message });
  }
})
router.get('/messfeedback',async(req,res)=>{
  try{
    const messfeedback1=await messfeedback.find();
    if(!messfeedback1){
      return res.send("no data found")
    }
    res.send({message:"data fetched",messfeedback:messfeedback1})

  }catch (err) {
    res.status(500).json({ error: err.message });
  }
})

module.exports = router
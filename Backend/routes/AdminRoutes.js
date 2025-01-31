const express=require('express');
const router=express.Router();
const messoff=require('../models/Messoff')

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

module.exports = router
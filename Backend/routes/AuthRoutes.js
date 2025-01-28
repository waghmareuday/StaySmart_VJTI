const express =require('express');
const AuthModel =require('../models/AuthModel'); // Feedback model
const router = express.Router();


router.post('/signup', async (req, res) => {
    try{
        const {name,email,collegeId,password}=req.body;
        console.log(email);

        const emailExist=await AuthModel.findOne({ email });
        if(emailExist!==null){
            return res.send({success:false,message:"email already exist"});
        }
        const newUser=await AuthModel.create({
            name,
            email,
            collegeId,
            password
        })

        if(newUser){
            return res.send({
                success:true,
                message:"User registered successfully",
                newUser
            })
        }else {
            return res.send({
              success: false,
              message: "Something went wrong",
            });
        }
    }catch(err){
        res.send({success:false,message:err.message});
    }
});

module.exports= router;
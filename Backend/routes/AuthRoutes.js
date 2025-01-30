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

router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login Attempt:', email); // Debugging

      const user = await AuthModel.findOne({ email });
      if (!user || user.password !== password) {
        return res.send({ message: 'Invalid credentials' });
      }
  
      //req.session.user = user; // Store user in session
     console.log(user);
     
      res.send({ message: 'Login successful', user: { id: user._id, name: user.name, email: user.email } });
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports= router;
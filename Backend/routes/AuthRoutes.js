const express =require('express');
const AuthModel =require('../models/AuthModel'); // Feedback model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();


router.post('/signup', async (req, res) => {
    try{
        const {name,email,collegeId,password}=req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!name || !normalizedEmail || !collegeId || !password) {
      return res.status(400).send({success:false,message:"All fields are required"});
    }

    const emailExist=await AuthModel.findOne({ email: normalizedEmail });
        if(emailExist!==null){
      return res.status(409).send({success:false,message:"email already exist"});
        }

    const existingCollegeId = await AuthModel.findOne({ collegeId });
    if (existingCollegeId) {
      return res.status(409).send({ success: false, message: "collegeId already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

        const newUser=await AuthModel.create({
            name,
      email: normalizedEmail,
            collegeId,
      password: hashedPassword,
      role: 'student'
        })

        if(newUser){
            return res.send({
                success:true,
                message:"User registered successfully",
        newUser: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          collegeId: newUser.collegeId,
          role: newUser.role
        }
            })
        }else {
      return res.status(500).send({
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
      const normalizedEmail = String(email || '').trim().toLowerCase();

      if (!normalizedEmail || !password) {
        return res.status(400).send({ success: false, message: 'Email and password are required' });
      }

      // Environment-backed admin login (keeps backwards compatibility if env is not set)
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@123').toLowerCase();
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
      if (normalizedEmail === adminEmail && password === adminPassword) {
        const token = jwt.sign(
          {
            id: 'admin',
            email: adminEmail,
            role: 'admin',
            isAdmin: true
          },
          process.env.JWT_SECRET || 'hostel-secret-key',
          { expiresIn: '24h' }
        );

        return res.send({
          success: true,
          message: 'Login successful',
          token,
          user: {
            id: 'admin',
            name: 'Administrator',
            email: adminEmail,
            role: 'admin',
            isAdmin: true
          }
        });
      }

      const user = await AuthModel.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).send({ success: false, message: 'Invalid credentials' });
      }

      let passwordMatches = false;
      // Supports migrated users (bcrypt hash)
      if (typeof user.password === 'string' && user.password.startsWith('$2')) {
        passwordMatches = await bcrypt.compare(password, user.password);
      } else {
        // Backward compatibility for legacy plaintext records; auto-migrate on successful login
        passwordMatches = user.password === password;
        if (passwordMatches) {
          user.password = await bcrypt.hash(password, 10);
          await user.save();
        }
      }

      if (!passwordMatches) {
        return res.status(401).send({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          collegeId: user.collegeId,
          role: user.role || 'student',
          isAdmin: (user.role || 'student') === 'admin'
        },
        process.env.JWT_SECRET || 'hostel-secret-key',
        { expiresIn: '24h' }
      );
  
      //req.session.user = user; // Store user in session
      // include collegeId as studentId for frontend convenience
      res.send({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          collegeId: user.collegeId,
          studentId: user.collegeId, // alias used by frontend
          role: user.role || 'student',
          isAdmin: (user.role || 'student') === 'admin'
        },
      });
      
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports= router;
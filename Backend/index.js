const express=require('express');
const app = express();
const cors = require('cors');
const mongoose =require('mongoose');
const dotenv =require('dotenv');

// Load environment variables
dotenv.config();
app.use(cors());
app.use(express.json());



const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected successfully!');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); // Exit process with failure
  }
};


connectDB();

// Routes
const feedbackRoutes = require('./routes/feedback');
const AuthRoutes = require("./routes/AuthRoutes")

// Use routes
app.use('/api/v1/feedback',feedbackRoutes);
app.use('/api/v1/auth',AuthRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const express=require('express');
const app = express();
const cors = require('cors');
const mongoose =require('mongoose');
const path = require('path');
const dotenv =require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });
if (!process.env.MONGO_URI) {
  dotenv.config();
}

const configuredOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (configuredOrigins.length > 0) {
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
  }));
} else {
  app.use(cors());
}

app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'StaySmart Backend API',
    timestamp: new Date().toISOString()
  });
});



const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri || typeof mongoUri !== 'string') {
      throw new Error('MONGO_URI is missing. Set it in Backend/.env or process environment.');
    }

    await mongoose.connect(mongoUri);
    console.log('Database connected successfully!');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); // Exit process with failure
  }
};

// Routes
const feedbackRoutes = require('./routes/feedback');
const AuthRoutes = require("./routes/AuthRoutes")
const HostelLeaving = require("./routes/Hostel")
const AdminRoutes = require("./routes/AdminRoutes")
const applicationRoutes = require('./routes/applicationRoutes');
const swapRoutes = require('./routes/swapRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const nightOutRoutes = require('./routes/nightOutRoutes');
const duesRoutes = require('./routes/duesRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const wardenRoutes = require('./routes/wardenRoutes');
const messRoutes = require('./routes/messRoutes');
const noticeRoutes = require('./routes/noticeRoutes');

// Use routes
app.use('/api/v1/feedback',feedbackRoutes);
app.use('/api/v1/auth',AuthRoutes);
app.use('/api/v1/hostel',HostelLeaving);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/admin',AdminRoutes);
app.use('/api/v1/swap', swapRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/nightout', nightOutRoutes);
app.use('/api/v1/dues', duesRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/warden', wardenRoutes);
app.use('/api/v1/mess', messRoutes);
app.use('/api/v1/notices', noticeRoutes);



// app.use('/api/v1/hos',HostelLeaving);
// app.use(cors({ origin: 'http://localhost:3000', credentials: true }));


const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();

const Warden = require('../models/Warden');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getManagedBlocks } = require('../utils/wardenAccess');

// Register new warden (Admin only)
exports.registerWarden = async (req, res) => {
  try {
    const { name, email, password, assignedBlock, contactNumber, role } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!name || !normalizedEmail || !password || !contactNumber) {
      return res.status(400).json({ success: false, message: 'name, email, password and contactNumber are required.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    // Check if warden already exists
    const existingWarden = await Warden.findOne({ email: normalizedEmail });
    if (existingWarden) {
      return res.status(400).json({ success: false, message: 'Warden with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const warden = new Warden({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      assignedBlock: String(assignedBlock || 'ALL').toUpperCase(),
      contactNumber,
      role: String(role || 'WARDEN').toUpperCase()
    });

    await warden.save();

    res.status(201).json({
      success: true,
      message: 'Warden registered successfully',
      warden: {
        id: warden._id,
        name: warden.name,
        email: warden.email,
        assignedBlock: warden.assignedBlock,
        role: warden.role
      }
    });
  } catch (error) {
    console.error('Error registering warden:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Warden login
exports.loginWarden = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find warden
    const warden = await Warden.findOne({ email: normalizedEmail });
    if (!warden) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if active
    if (!warden.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, warden.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const managedBlocks = getManagedBlocks(warden);
    const token = jwt.sign(
      { 
        id: warden._id, 
        email: warden.email, 
        role: warden.role,
        assignedBlock: warden.assignedBlock,
        managedBlocks,
        isWarden: true 
      },
      process.env.JWT_SECRET || 'hostel-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      warden: {
        id: warden._id,
        name: warden.name,
        email: warden.email,
        assignedBlock: warden.assignedBlock,
        managedBlocks,
        role: warden.role,
        contactNumber: warden.contactNumber
      }
    });
  } catch (error) {
    console.error('Error logging in warden:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get warden profile
exports.getWardenProfile = async (req, res) => {
  try {
    const requesterId = String(req.warden?.id || '');
    const requestedId = String(req.params.id || '');
    const requesterRole = String(req.warden?.role || '').toUpperCase();

    if (requesterRole !== 'CHIEF_WARDEN' && requesterId !== requestedId) {
      return res.status(403).json({ success: false, message: 'You can only access your own profile.' });
    }

    const warden = await Warden.findById(req.params.id).select('-password');
    if (!warden) {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }
    res.json({ success: true, warden });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all wardens (Admin only)
exports.getAllWardens = async (req, res) => {
  try {
    const wardens = await Warden.find().select('-password');
    res.json({ success: true, wardens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update warden
exports.updateWarden = async (req, res) => {
  try {
    const { name, assignedBlock, contactNumber, isActive } = req.body;
    
    const warden = await Warden.findByIdAndUpdate(
      req.params.id,
      { name, assignedBlock, contactNumber, isActive },
      { new: true }
    ).select('-password');
    
    if (!warden) {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }
    
    res.json({ success: true, warden });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete warden
exports.deleteWarden = async (req, res) => {
  try {
    const warden = await Warden.findByIdAndDelete(req.params.id);
    if (!warden) {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }
    res.json({ success: true, message: 'Warden deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Seed default wardens (for testing)
exports.seedWardens = async (req, res) => {
  try {
    if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
      return res.status(403).json({ success: false, message: 'Seeding wardens is disabled in production.' });
    }

    const existingWardens = await Warden.countDocuments();
    const forceSeed = req.query?.force === 'true' || req.body?.force === true;

    if (existingWardens > 0 && !forceSeed) {
      return res.status(409).json({
        success: false,
        message: 'Wardens already exist. Use force=true to reseed and overwrite existing records.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    
    const defaultWardens = [
      {
        name: 'Chief Warden',
        email: 'chiefwarden@vjti.ac.in',
        password: await bcrypt.hash('chief123', salt),
        assignedBlock: 'ALL',
        contactNumber: '9876543210',
        role: 'CHIEF_WARDEN'
      },
      {
        name: 'Block A Warden',
        email: 'wardena@vjti.ac.in',
        password: await bcrypt.hash('warden123', salt),
        assignedBlock: 'A',
        contactNumber: '9876543211',
        role: 'WARDEN'
      },
      {
        name: 'PG Hostel Warden',
        email: 'wardenc@vjti.ac.in',
        password: await bcrypt.hash('warden123', salt),
        assignedBlock: 'PG',
        contactNumber: '9876543212',
        role: 'WARDEN'
      }
    ];

    // Clear existing wardens only for explicit reseed.
    if (existingWardens > 0) {
      await Warden.deleteMany({});
    }
    
    // Insert new ones
    await Warden.insertMany(defaultWardens);

    res.json({
      success: true,
      message: 'Default wardens created',
      wardens: defaultWardens.map(w => ({ email: w.email, password: 'warden123 / chief123' }))
    });
  } catch (error) {
    console.error('Error seeding wardens:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

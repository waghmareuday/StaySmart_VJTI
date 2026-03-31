const Room = require('../models/roomModel');
const AuthModel = require('../models/AuthModel');
const Application = require('../models/applicationModel');
const bcrypt = require('bcryptjs');

const deriveCollegeIdFromStudentId = (studentId) => {
  const normalized = String(studentId || '').trim();
  if (!normalized) return null;

  const direct = Number(normalized);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const trailingDigits = normalized.match(/(\d+)$/);
  if (trailingDigits) {
    const parsed = Number(trailingDigits[1]);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

exports.seedRooms = async (req, res) => {
  try {
    const roomsToInsert = [];

    // 1. Seed C Block (Boys, FY, 3 floors, 20 rooms/floor, 3 capacity)
    for (let floor = 1; floor <= 3; floor++) {
      for (let i = 1; i <= 20; i++) {
        // Formats to C-101, C-102 ... C-120
        const roomNum = `C-${floor}${i.toString().padStart(2, '0')}`;
        roomsToInsert.push({
          roomNumber: roomNum,
          block: 'C',
          floor: floor,
          capacity: 3,
          gender: 'M',
          isAvailable: true
        });
      }
    }

    // 2. Seed PG Hostel / T Block (Boys, Senior, 6 floors, 50 rooms/floor, 2 capacity)
    for (let floor = 1; floor <= 6; floor++) {
      for (let i = 1; i <= 50; i++) {
        const roomNum = `T-${floor}${i.toString().padStart(2, '0')}`;
        roomsToInsert.push({
          roomNumber: roomNum,
          block: 'PG',
          floor: floor,
          capacity: 2,
          gender: 'M',
          // Keep 6th floor vacant as per your rules
          isAvailable: floor !== 6 
        });
      }
    }

    // 3. Seed A Block (Girls, 7 floors, 30 rooms/floor, 2 capacity)
    // Floors 1-2 for FY, Floors 3-7 for Seniors
    for (let floor = 1; floor <= 7; floor++) {
      for (let i = 1; i <= 30; i++) {
        const roomNum = `A-${floor}${i.toString().padStart(2, '0')}`;
        roomsToInsert.push({
          roomNumber: roomNum,
          block: 'A',
          floor: floor,
          capacity: 2,
          gender: 'F',
          isAvailable: true
        });
      }
    }

    // Clear existing rooms just in case, then bulk insert
    await Room.deleteMany({});
    await Room.insertMany(roomsToInsert);

    res.status(201).json({
      message: "Successfully seeded all hostel rooms!",
      totalRooms: roomsToInsert.length
    });
  } catch (error) {
    console.error("Error seeding rooms:", error);
    res.status(500).json({ error: "Failed to seed rooms" });
  }
};

// --- NEW: generate a bunch of dummy student applications for testing ---
exports.seedApplications = async (req, res) => {
  try {
    await Application.deleteMany({});
    const applications = [];

    // 1) FY boys: 13 students
    for (let i = 1; i <= 13; i++) {
      applications.push({
        studentId: `FYM${100 + i}`,
        academicYear: 'FY',
        gender: 'M',
        mhtCetRank: i,
        homePincode: '420000',
        distanceFromCollege: 120,
        status: 'READY_FOR_ALLOTMENT'
      });
    }

    // 2) FY girls: 12 students (total FY = 25)
    for (let i = 1; i <= 12; i++) {
      applications.push({
        studentId: `FYW${200 + i}`,
        academicYear: 'FY',
        gender: 'F',
        mhtCetRank: i + 13,
        homePincode: '420000',
        distanceFromCollege: 120,
        status: 'READY_FOR_ALLOTMENT'
      });
    }

    // 3) Senior boys (mixed SY/TY), ready singles: 12 (running total = 37)
    for (let i = 1; i <= 12; i++) {
      applications.push({
        studentId: `SYM${300 + i}`,
        academicYear: i % 2 === 0 ? 'TY' : 'SY',
        gender: 'M',
        homePincode: '420000',
        distanceFromCollege: 120,
        status: 'READY_FOR_ALLOTMENT'
      });
    }

    // 4) Senior girls (mixed SY/TY), ready singles: 8 (running total = 45)
    for (let i = 1; i <= 8; i++) {
      applications.push({
        studentId: `SYW${400 + i}`,
        academicYear: i % 2 === 0 ? 'TY' : 'SY',
        gender: 'F',
        homePincode: '420000',
        distanceFromCollege: 120,
        status: 'READY_FOR_ALLOTMENT'
      });
    }

    // 5) Two mutual roommate pairs (4 students, running total = 49)
    applications.push({
      studentId: 'SYM451',
      academicYear: 'SY',
      gender: 'M',
      homePincode: '420000',
      distanceFromCollege: 120,
      requestedRoommateId: 'SYM452',
      roommateAcceptedBy: 'SYM452',
      status: 'READY_FOR_ALLOTMENT'
    });
    applications.push({
      studentId: 'SYM452',
      academicYear: 'SY',
      gender: 'M',
      homePincode: '420000',
      distanceFromCollege: 120,
      requestedRoommateId: 'SYM451',
      roommateAcceptedBy: 'SYM451',
      status: 'READY_FOR_ALLOTMENT'
    });
    applications.push({
      studentId: 'TYM453',
      academicYear: 'TY',
      gender: 'M',
      homePincode: '420000',
      distanceFromCollege: 120,
      requestedRoommateId: 'TYM454',
      roommateAcceptedBy: 'TYM454',
      status: 'READY_FOR_ALLOTMENT'
    });
    applications.push({
      studentId: 'TYM454',
      academicYear: 'TY',
      gender: 'M',
      homePincode: '420000',
      distanceFromCollege: 120,
      requestedRoommateId: 'TYM453',
      roommateAcceptedBy: 'TYM453',
      status: 'READY_FOR_ALLOTMENT'
    });

    // 6) One waiting-for-partner example (final total = 50)
    applications.push({
      studentId: 'SYM499',
      academicYear: 'SY',
      gender: 'M',
      homePincode: '420000',
      distanceFromCollege: 120,
      requestedRoommateId: 'SYM500',
      status: 'WAITING_FOR_PARTNER'
    });

    await Application.insertMany(applications);
    res.status(201).json({
      message: 'Seeded 50 test applications',
      total: applications.length,
      breakdown: {
        fy: 25,
        seniorsReady: 24,
        waitingForPartner: 1
      }
    });
  } catch (error) {
    console.error('Error seeding applications:', error);
    res.status(500).json({ error: 'Failed to seed applications' });
  }
};

// Backfill missing student users from applications (for dev/testing datasets).
exports.seedStudentUsers = async (req, res) => {
  try {
    const onlyAllotted = req.query?.onlyAllotted === 'true' || req.body?.onlyAllotted === true;
    const appQuery = onlyAllotted ? { status: 'ALLOTTED' } : {};

    const applications = await Application.find(appQuery).select('studentId').lean();
    const studentIds = [...new Set(
      applications
        .map((application) => String(application.studentId || '').trim())
        .filter(Boolean)
    )];

    const existingUsers = await AuthModel.find({}).select('collegeId email').lean();
    const existingCollegeIds = new Set(existingUsers.map((user) => Number(user.collegeId)).filter(Number.isFinite));
    const existingEmails = new Set(existingUsers.map((user) => String(user.email || '').toLowerCase()));

    const passwordSeed = process.env.TEST_STUDENT_DEFAULT_PASSWORD || 'student123';
    const hashedPassword = await bcrypt.hash(passwordSeed, 10);

    let skippedExisting = 0;
    let skippedInvalidIds = 0;
    let emailCollisionsResolved = 0;
    const usersToCreate = [];

    for (const studentId of studentIds) {
      const collegeId = deriveCollegeIdFromStudentId(studentId);

      if (!Number.isFinite(collegeId)) {
        skippedInvalidIds += 1;
        continue;
      }

      if (existingCollegeIds.has(collegeId)) {
        skippedExisting += 1;
        continue;
      }

      const safeId = String(studentId).toLowerCase().replace(/[^a-z0-9._-]/g, '') || `student${collegeId}`;
      let email = `${safeId}@staysmart.test`;
      let suffix = 1;
      while (existingEmails.has(email)) {
        email = `${safeId}.${suffix}@staysmart.test`;
        suffix += 1;
        emailCollisionsResolved += 1;
      }

      usersToCreate.push({
        name: `Student ${studentId}`,
        email,
        collegeId,
        password: hashedPassword,
        role: 'student'
      });

      existingCollegeIds.add(collegeId);
      existingEmails.add(email);
    }

    if (usersToCreate.length > 0) {
      await AuthModel.insertMany(usersToCreate, { ordered: false });
    }

    return res.status(201).json({
      success: true,
      message: `Created ${usersToCreate.length} student users from application data.`,
      summary: {
        onlyAllotted,
        applicationsConsidered: studentIds.length,
        createdUsers: usersToCreate.length,
        skippedExisting,
        skippedInvalidIds,
        emailCollisionsResolved,
        defaultPassword: passwordSeed
      }
    });
  } catch (error) {
    console.error('Error seeding student users from applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to seed student users from applications',
      error: error.message
    });
  }
};
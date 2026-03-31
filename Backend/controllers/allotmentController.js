// controllers/allotmentController.js
const Application = require('../models/applicationModel');
const Room = require('../models/roomModel');

/**
 * Comprehensive First Year Allocation Algorithm
 * - Clears previous allotments before running
 * - Uses CET rank for merit-based allocation
 * - Validates room capacity constraints
 * - Returns preview or publishes to DB based on mode
 */
exports.allocateFirstYears = async (req, res) => {
  try {
    const isPreview = req.query.preview === 'true';
    const allocationRound = Date.now(); // Unique identifier for this round

    // STEP 1: Clear previous FY allocations if not in preview mode
    if (!isPreview) {
      // Reset all previously allotted FY students
      await Application.updateMany(
        { academicYear: 'FY', status: 'ALLOTTED' },
        { status: 'READY_FOR_ALLOTMENT', allottedRoom: null, allotmentRound: null, isProcessed: false }
      );

      // Clear all FY rooms:
      // - C-Block (FY Boys, capacity 3)
      // - A-Block floors 1-2 (FY Girls, capacity 2)
      await Room.updateMany(
        { block: 'C', gender: 'M' },
        { occupants: [], allottedAt: null, allotmentRound: null }
      );
      await Room.updateMany(
        { block: 'A', gender: 'F', floor: { $lte: 2 } },
        { occupants: [], allottedAt: null, allotmentRound: null }
      );
    }

    // STEP 2: Fetch eligible FY students sorted by CET rank (ascending = better)
    const fyBoys = await Application.find({
      academicYear: 'FY',
      gender: 'M',
      status: 'READY_FOR_ALLOTMENT'
    }).sort({ mhtCetRank: 1 });

    const fyGirls = await Application.find({
      academicYear: 'FY',
      gender: 'F',
      status: 'READY_FOR_ALLOTMENT'
    }).sort({ mhtCetRank: 1 });

    // STEP 3: Fetch available C-block (boys) and A-block floor 1-2 (girls) rooms
    const cBlockRooms = await Room.find({
      block: 'C',
      gender: 'M',
      isAvailable: true
    }).sort({ floor: 1, roomNumber: 1 }).lean(); // Use lean() for plain objects

    const aBlockRooms = await Room.find({
      block: 'A',
      gender: 'F',
      floor: { $lte: 2 },
      isAvailable: true
    }).sort({ floor: 1, roomNumber: 1 }).lean();

    const appUpdates = [];
    const roomUpdates = [];
    const previewDetails = [];

    // Track room occupancy separately to avoid modifying original data
    const roomOccupancyTracker = new Map();

    /**
     * Core allocation logic
     * Fills rooms sequentially up to their actual capacity
     */
    const allocate = (students, rooms) => {
      let studentIdx = 0;

      for (let room of rooms) {
        // Initialize tracker for this room
        if (!roomOccupancyTracker.has(room._id.toString())) {
          roomOccupancyTracker.set(room._id.toString(), [...(room.occupants || [])]);
        }
        
        const currentOccupants = roomOccupancyTracker.get(room._id.toString());
        const roomCapacity = room.capacity; // Use actual room capacity
        const availableSlots = roomCapacity - currentOccupants.length;

        if (availableSlots <= 0) continue; // Skip full rooms

        // Allocate up to available slots OR until students run out
        let slotsUsed = 0;
        while (slotsUsed < availableSlots && studentIdx < students.length) {
          const student = students[studentIdx];

          // Queue the allocation
          appUpdates.push({
            updateOne: {
              filter: { _id: student._id },
              update: {
                status: 'ALLOTTED',
                allottedRoom: room._id,
                allotmentRound: allocationRound,
                isProcessed: true
              }
            }
          });

          // Track in our separate tracker (not modifying original room)
          currentOccupants.push(student.studentId);

          // Store preview data (field names match frontend expectations)
          previewDetails.push({
            studentId: student.studentId,
            gender: student.gender,
            rank: student.mhtCetRank,
            room: room.roomNumber,
            block: room.block,
            floor: room.floor,
            partnerRequested: null
          });

          slotsUsed++;
          studentIdx++;
        }

        // If we added anyone to this room, queue the update
        if (slotsUsed > 0) {
          roomUpdates.push({
            updateOne: {
              filter: { _id: room._id },
              update: {
                occupants: currentOccupants,
                allottedAt: new Date(),
                allotmentRound: allocationRound
              }
            }
          });
        }

        // Break early if all students allocated
        if (studentIdx >= students.length) break;
      }
    };

    // Run allocation for both genders (using actual room capacities)
    allocate(fyBoys, cBlockRooms);
    allocate(fyGirls, aBlockRooms);

    // STEP 4: Handle preview mode (dry-run)
    if (isPreview) {
      const totalApplicants = fyBoys.length + fyGirls.length;
      return res.status(200).json({
        message: "✅ FY Allocation Preview Generated",
        isPreview: true,
        stats: {
          totalApplicants,
          allottedCount: previewDetails.length,
          unallottedCount: totalApplicants - previewDetails.length,
          boysAllotted: previewDetails.filter(p => p.gender === 'M').length,
          girlsAllotted: previewDetails.filter(p => p.gender === 'F').length
        },
        previewList: previewDetails.sort((a, b) => (a.rank || 0) - (b.rank || 0)),
        warnings: totalApplicants - previewDetails.length > 0
          ? [`⚠️ ${totalApplicants - previewDetails.length} students could not be allotted due to insufficient rooms`]
          : []
      });
    }

    // STEP 5: Publish mode - execute database writes
    let publishedCount = 0;
    if (appUpdates.length > 0) {
      await Application.bulkWrite(appUpdates);
      publishedCount = appUpdates.length;
    }
    if (roomUpdates.length > 0) {
      await Room.bulkWrite(roomUpdates);
    }

    res.status(200).json({
      message: "✅ FY Allocation published successfully",
      allottedCount: publishedCount,
      boysAllotted: previewDetails.filter(p => p.gender === 'M').length,
      girlsAllotted: previewDetails.filter(p => p.gender === 'F').length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Error in FY allocation:", error);
    res.status(500).json({ error: "Allocation failed: " + error.message });
  }
};

/**
 * Senior Allocation Algorithm
 * - Matches pre-identified couples first
 * - Pairs remaining singles randomly
 * - Handles edge cases (odd numbers, mismatches)
 */
exports.allocateSeniors = async (req, res) => {
  try {
    const isPreview = req.query.preview === 'true';
    const allocationRound = Date.now();

    // STEP 1: Clear previous senior allocations if publishing
    if (!isPreview) {
      await Application.updateMany(
        { academicYear: { $ne: 'FY' }, status: 'ALLOTTED' },
        { status: 'READY_FOR_ALLOTMENT', allottedRoom: null, allotmentRound: null, isProcessed: false }
      );

      await Room.updateMany(
        {
          $or: [
            { block: 'PG', gender: 'M' },
            { block: 'A', gender: 'F', floor: { $gt: 2 } }
          ]
        },
        { occupants: [], allottedAt: null, allotmentRound: null }
      );
    }

    // STEP 2: Fetch eligible seniors
    const seniorBoys = await Application.find({
      academicYear: { $ne: 'FY' },
      gender: 'M',
      status: 'READY_FOR_ALLOTMENT'
    });

    const seniorGirls = await Application.find({
      academicYear: { $ne: 'FY' },
      gender: 'F',
      status: 'READY_FOR_ALLOTMENT'
    });

    // STEP 3: Fetch available rooms (use lean() to get plain objects)
    const pgRooms = await Room.find({
      block: 'PG',
      gender: 'M',
      isAvailable: true
    }).sort({ floor: 1, roomNumber: 1 }).lean();

    const aBlockSeniorRooms = await Room.find({
      block: 'A',
      gender: 'F',
      floor: { $gt: 2 },
      isAvailable: true
    }).sort({ floor: 1, roomNumber: 1 }).lean();

    const appUpdates = [];
    const roomUpdates = [];
    const previewDetails = [];
    
    // Track room occupancy separately to avoid modifying original data
    const roomOccupancyTracker = new Map();

    /**
     * Groups students into pre-matched pairs and singles
     * Returns { pairs: [{students: [student1, student2], matchType: 'mutual'|'one-sided'}, ...], singles: [...] }
     * 
     * INTELLIGENT MATCHING LOGIC:
     * 1. Mutual preference: A wants B, B wants A → Pair them (highest priority)
     * 2. One-sided + flexible: A wants B, B wants no one → Pair them (one-sided acceptance)
     * 3. One-sided conflicting: A wants B, B wants C → Both go to singles pool
     * 4. No preference: Student wants no one → Goes to singles pool for random pairing
     */
    const groupStudents = (students) => {
      const pairs = [];
      const singles = [];
      const studentMap = new Map();
      const processed = new Set();

      // Build lookup map
      students.forEach(s => studentMap.set(s.studentId, s));

      // PASS 1: Find MUTUAL matches first (highest priority)
      for (let student of students) {
        if (processed.has(student.studentId)) continue;

        if (student.requestedRoommateId) {
          const partner = studentMap.get(student.requestedRoommateId);

          // Check if partner exists in this batch AND requested student back (MUTUAL)
          if (partner && !processed.has(partner.studentId) &&
              partner.requestedRoommateId === student.studentId) {
            // MUTUAL MATCH - Pair them
            pairs.push({ students: [student, partner], matchType: 'mutual' });
            processed.add(student.studentId);
            processed.add(partner.studentId);
            console.log(`[MUTUAL PAIR] ${student.studentId} <-> ${partner.studentId}`);
          }
        }
      }

      // PASS 2: Find ONE-SIDED matches where partner has no preference
      for (let student of students) {
        if (processed.has(student.studentId)) continue;

        if (student.requestedRoommateId) {
          const partner = studentMap.get(student.requestedRoommateId);

          // Check if partner exists, not processed, and has NO roommate preference (flexible)
          if (partner && !processed.has(partner.studentId) && !partner.requestedRoommateId) {
            // ONE-SIDED + FLEXIBLE - Partner accepts since they had no preference
            pairs.push({ students: [student, partner], matchType: 'one-sided' });
            processed.add(student.studentId);
            processed.add(partner.studentId);
            console.log(`[ONE-SIDED PAIR] ${student.studentId} -> ${partner.studentId} (${partner.studentId} was flexible)`);
          }
        }
      }

      // PASS 3: Everyone else goes to singles pool
      for (let student of students) {
        if (!processed.has(student.studentId)) {
          singles.push(student);
          processed.add(student.studentId);
          
          // Log why they're single
          if (student.requestedRoommateId) {
            const partner = studentMap.get(student.requestedRoommateId);
            if (!partner) {
              console.log(`[SINGLE] ${student.studentId} - requested ${student.requestedRoommateId} who didn't apply`);
            } else if (partner.requestedRoommateId && partner.requestedRoommateId !== student.studentId) {
              console.log(`[SINGLE] ${student.studentId} - requested ${student.requestedRoommateId} who wants someone else`);
            }
          } else {
            console.log(`[SINGLE] ${student.studentId} - no roommate preference`);
          }
        }
      }

      console.log(`[GROUPING SUMMARY] ${pairs.length} pairs formed, ${singles.length} singles remaining`);
      return { pairs, singles };
    };

    /**
     * Assigns students to 2-seater rooms
     */
    const assignRooms = (groupedData, rooms) => {
      const { pairs, singles } = groupedData;
      let roomIdx = 0;

      const getCurrentOccupants = (room) => {
        const roomKey = room._id.toString();
        if (!roomOccupancyTracker.has(roomKey)) {
          roomOccupancyTracker.set(roomKey, [...(room.occupants || [])]);
        }
        return roomOccupancyTracker.get(roomKey);
      };

      const getAvailableSlots = (room) => {
        const currentOccupants = getCurrentOccupants(room);
        const roomCapacity = room.capacity || 2;
        return roomCapacity - currentOccupants.length;
      };

      /**
       * Helper to assign students to a room
       * @param {Object} room - The room to assign to
       * @param {Array} studentsToAdd - Array of student objects
       * @param {string} matchType - 'mutual', 'one-sided', or 'random'
       */
      const addToRoom = (room, studentsToAdd, matchType = 'random') => {
        const currentOccupants = getCurrentOccupants(room);

        studentsToAdd.forEach(student => {
          appUpdates.push({
            updateOne: {
              filter: { _id: student._id },
              update: {
                status: 'ALLOTTED',
                allottedRoom: room._id,
                allotmentRound: allocationRound,
                isProcessed: true
              }
            }
          });

          currentOccupants.push(student.studentId);
          previewDetails.push({
            studentId: student.studentId,
            gender: student.gender,
            partnerRequested: student.requestedRoommateId || null,
            room: room.roomNumber,
            block: room.block,
            floor: room.floor,
            matchType: matchType,
            rank: null
          });
        });

        roomUpdates.push({
          updateOne: {
            filter: { _id: room._id },
            update: {
              occupants: currentOccupants,
              allottedAt: new Date(),
              allotmentRound: allocationRound
            }
          }
        });
      };

      // PHASE A: Allocate pre-matched pairs first (priority)
      for (let pairData of pairs) {
        while (roomIdx < rooms.length && getAvailableSlots(rooms[roomIdx]) < 2) {
          roomIdx++;
        }
        if (roomIdx >= rooms.length) break;

        addToRoom(rooms[roomIdx], pairData.students, pairData.matchType);
        roomIdx++;
      }

      // PHASE B: Pair up remaining singles (based on room capacity)
      let singleIdx = 0;
      while (singleIdx < singles.length && roomIdx < rooms.length) {
        const room = rooms[roomIdx];
        const availableSlots = getAvailableSlots(room);
        const studentsToAdd = [];

        if (availableSlots <= 0) {
          roomIdx++;
          continue;
        }

        // Fill room up to remaining free slots
        for (let i = 0; i < availableSlots && singleIdx < singles.length; i++) {
          studentsToAdd.push(singles[singleIdx++]);
        }
        
        if (studentsToAdd.length > 0) {
          addToRoom(room, studentsToAdd);
        }
        roomIdx++;
      }

      // Remaining singles (if any) couldn't be allocated (odd number or out of rooms)
      // They remain in READY_FOR_ALLOTMENT status
    };

    // Execute grouping and assignment
    const boysGrouped = groupStudents(seniorBoys);
    const girlsGrouped = groupStudents(seniorGirls);

    assignRooms(boysGrouped, pgRooms);
    assignRooms(girlsGrouped, aBlockSeniorRooms);

    // STEP 4: Preview mode
    if (isPreview) {
      const totalApplicants = seniorBoys.length + seniorGirls.length;
      const mutualPairs = previewDetails.filter(p => p.matchType === 'mutual').length / 2;
      const oneSidedPairs = previewDetails.filter(p => p.matchType === 'one-sided').length / 2;
      return res.status(200).json({
        message: "✅ Senior Allocation Preview Generated",
        isPreview: true,
        stats: {
          totalApplicants,
          allottedCount: previewDetails.length,
          unallottedCount: totalApplicants - previewDetails.length,
          boysAllotted: previewDetails.filter(p => p.gender === 'M').length,
          girlsAllotted: previewDetails.filter(p => p.gender === 'F').length,
          mutualPairs: mutualPairs,
          oneSidedPairs: oneSidedPairs,
          randomPairs: (previewDetails.length / 2) - mutualPairs - oneSidedPairs
        },
        previewList: previewDetails,
        warnings: totalApplicants - previewDetails.length > 0
          ? [`⚠️ ${totalApplicants - previewDetails.length} seniors could not be allotted due to insufficient rooms`]
          : []
      });
    }

    // STEP 5: Publish mode
    let publishedCount = 0;
    if (appUpdates.length > 0) {
      await Application.bulkWrite(appUpdates);
      publishedCount = appUpdates.length;
    }
    if (roomUpdates.length > 0) {
      await Room.bulkWrite(roomUpdates);
    }

    res.status(200).json({
      message: "✅ Senior Allocation published successfully",
      allottedCount: publishedCount,
      boysAllotted: previewDetails.filter(p => p.gender === 'M').length,
      girlsAllotted: previewDetails.filter(p => p.gender === 'F').length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Error in Senior allocation:", error);
    res.status(500).json({ error: "Allocation failed: " + error.message });
  }
};

exports.getMasterList = async (req, res) => {
  try {
    const occupiedRooms = await Room.find({
      occupants: { $exists: true, $not: { $size: 0 } }
    }).sort({ block: 1, floor: 1, roomNumber: 1 });

    res.status(200).json({
      message: `✅ Fetched ${occupiedRooms.length} occupied rooms`,
      rooms: occupiedRooms,
      totalOccupancy: occupiedRooms.reduce((sum, r) => sum + (r.occupants?.length || 0), 0)
    });
  } catch (error) {
    console.error("Error fetching master list:", error);
    res.status(500).json({ error: "Failed to fetch master list." });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find({})
      .populate('allottedRoom')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: `✅ Fetched ${applications.length} applications`,
      applications,
      statusBreakdown: {
        pending: applications.filter(a => a.status === 'PENDING').length,
        waiting: applications.filter(a => a.status === 'WAITING_FOR_PARTNER').length,
        ready: applications.filter(a => a.status === 'READY_FOR_ALLOTMENT').length,
        allotted: applications.filter(a => a.status === 'ALLOTTED').length,
        rejected: applications.filter(a => a.status === 'REJECTED_DISTANCE').length
      }
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Failed to fetch applications." });
  }
};

/**
 * Reset Academic Year - Clear all allocations for new year
 */
exports.resetAcademicYear = async (req, res) => {
  try {
    // Clear all applications
    const appResult = await Application.deleteMany({});

    // Clear all room occupants
    const roomResult = await Room.updateMany(
      {},
      { occupants: [], allottedAt: null, allotmentRound: null }
    );

    res.status(200).json({
      message: "✅ Academic year reset successfully",
      applicationsDeleted: appResult.deletedCount,
      roomsCleaned: roomResult.modifiedCount
    });
  } catch (error) {
    console.error("Error resetting academic year:", error);
    res.status(500).json({ error: "Reset failed: " + error.message });
  }
};

/**
 * Manually allot a specific student to a room
 * Admin feature for individual allotments
 */
exports.manualAllotStudent = async (req, res) => {
  try {
    let { studentId, roomId } = req.body;
    studentId = String(studentId || '').trim().toUpperCase();

    // Find the application
    const app = await Application.findOne({ studentId });
    if (!app) {
      return res.status(404).json({ error: `Student ${studentId} not found` });
    }

    // Check if already allotted
    if (app.status === 'ALLOTTED') {
      return res.status(400).json({ error: `Student ${studentId} is already allotted to a room` });
    }

    // Find the target room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check room capacity
    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({ error: `Room ${room.roomNumber} is full (${room.occupants.length}/${room.capacity})` });
    }

    // Check gender compatibility
    if (room.gender !== app.gender) {
      return res.status(400).json({ error: `Gender mismatch: Student is ${app.gender}, room is for ${room.gender}` });
    }

    // Perform allotment
    app.status = 'ALLOTTED';
    app.allottedRoom = room._id;
    app.allotmentRound = Date.now();
    app.isProcessed = true;
    await app.save();

    // Add to room
    room.occupants.push(studentId);
    room.allottedAt = new Date();
    await room.save();

    res.status(200).json({
      message: `✅ Successfully allotted ${studentId} to room ${room.roomNumber}`,
      student: studentId,
      room: room.roomNumber
    });

  } catch (error) {
    console.error("Error in manual allotment:", error);
    res.status(500).json({ error: "Manual allotment failed: " + error.message });
  }
};

/**
 * Cancel/revoke a student's room allotment
 * Admin feature
 */
exports.cancelStudentAllotment = async (req, res) => {
  try {
    let { studentId } = req.body;
    studentId = String(studentId || '').trim().toUpperCase();

    // Find the application
    const app = await Application.findOne({ studentId }).populate('allottedRoom');
    if (!app) {
      return res.status(404).json({ error: `Student ${studentId} not found` });
    }

    if (app.status !== 'ALLOTTED') {
      return res.status(400).json({ error: `Student ${studentId} is not currently allotted a room` });
    }

    const room = app.allottedRoom;
    if (room) {
      // Remove student from room
      room.occupants = room.occupants.filter(occ => occ.toUpperCase() !== studentId);
      await room.save();
    }

    // Reset application status
    app.status = 'READY_FOR_ALLOTMENT';
    app.allottedRoom = null;
    app.allotmentRound = null;
    app.isProcessed = false;
    await app.save();

    res.status(200).json({
      message: `✅ Cancelled allotment for ${studentId}. They are now back in the waiting pool.`,
      student: studentId,
      previousRoom: room?.roomNumber || 'N/A'
    });

  } catch (error) {
    console.error("Error cancelling allotment:", error);
    res.status(500).json({ error: "Cancellation failed: " + error.message });
  }
};

/**
 * Get available rooms for manual allotment
 * Returns rooms with available capacity
 */
exports.getAvailableRooms = async (req, res) => {
  try {
    const { gender, block } = req.query;
    
    const query = { isAvailable: true };
    if (gender) query.gender = gender;
    if (block) query.block = block;

    const rooms = await Room.find(query).sort({ block: 1, floor: 1, roomNumber: 1 });
    
    const availableRooms = rooms.filter(
      room => (room.occupants?.length || 0) < room.capacity
    );

    res.status(200).json({
      message: `Found ${availableRooms.length} available rooms`,
      rooms: availableRooms.map(r => ({
        _id: r._id,
        roomNumber: r.roomNumber,
        block: r.block,
        floor: r.floor,
        gender: r.gender,
        capacity: r.capacity,
        currentOccupancy: r.occupants?.length || 0,
        availableSlots: r.capacity - (r.occupants?.length || 0)
      }))
    });

  } catch (error) {
    console.error("Error fetching available rooms:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
};


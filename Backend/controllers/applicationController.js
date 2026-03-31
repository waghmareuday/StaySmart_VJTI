// controllers/applicationController.js
const Application = require('../models/applicationModel');
const {
  getAuthStudentId,
  getOwnedIdClause,
  getOwnedStudentMatchQuery,
  isOwnedStudentId,
  normalizeStudentId
} = require('../utils/studentIdentity');

/**
 * Real-world distance calculation
 * Based on pincode database - can be extended with actual geo-coordinates
 * Returns distance in km
 */
const getDistanceFromVJTI = async (pincode) => {
  const pin = String(pincode || '').trim();

  // Real distance mapping (expand this based on actual pincodes)
  const distanceMap = {
    // Mumbai metro (close to VJTI - Veermata Jijabai Technological Institute, Mumbai)
    '400001': 5,   // Fort
    '400002': 8,   // Kala Ghoda
    '400004': 3,   // Dadar
    '400005': 2,   // Near VJTI
    '400006': 6,   // Malabar Hill
    '400007': 10,  // Colaba
    '400008': 7,   // Girgaum
    '400009': 4,   // Dhobi Talao
    '400010': 12,  // Parel
    '400012': 9,   // Mahim
    '400013': 11,  // Byculla
    '400014': 6,   // Fort area
    '400016': 8,   // Opera House
    '400020': 15,  // Worli
    '400021': 12,  // Lower Parel
    '400025': 18,  // Sion
    '400026': 20,  // Chembur
    '400028': 22,  // Vile Parle
    '400031': 25,  // Andheri
    '400050': 28,  // Santacruz
    '400051': 30,  // Powai
    '400052': 32,  // Mulund
    '400053': 35,  // Ghatkopar
    '400054': 38,  // Vikroli
    '400055': 40,  // Kanjurmarg
    '400056': 42,  // Bhandup
    '400057': 45,  // Chembur (far)
    '400058': 50,  // Mankhurd
    '400059': 55,  // Ghatkopar (far)
    '400060': 60,  // Thane
    '400061': 65,  // Thane (far)
    '400064': 70,  // Beyond eligible zone
    '400066': 75,  // Beyond eligible zone
    '400069': 80,  // Beyond eligible zone
    '400070': 85,  // Beyond eligible zone
    '400071': 90,  // Beyond eligible zone
    '400072': 95,  // Beyond eligible zone
    '400075': 100, // Beyond eligible zone
  };

  // If exact pincode exists, use it
  if (distanceMap[pin]) {
    return distanceMap[pin];
  }

  // If 6-digit pincode starts with VJTI's: 400005, assume within metro
  if (pin.startsWith('400') || pin.startsWith('401')) {
    return 120; // Use max realistic distance for unknown Mumbai pincode
  }

  // Outside immediate metro area - consider not eligible
  return 200;
};

exports.submitApplication = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ message: 'Unable to resolve authenticated student.' });
    }

    let {
      studentId,
      academicYear,
      gender,
      mhtCetRank,
      homePincode,
      requestedRoommateId
    } = req.body;

    // Sanitize inputs
    studentId = normalizeStudentId(studentId);
    academicYear = String(academicYear || '').trim();
    gender = String(gender || '').trim().toUpperCase();
    homePincode = String(homePincode || '').trim();
    requestedRoommateId = requestedRoommateId ? normalizeStudentId(requestedRoommateId) : null;

    if (studentId && !isOwnedStudentId(authStudentId, studentId)) {
      return res.status(403).json({ message: 'You can only submit an application for your own account.' });
    }

    studentId = studentId || authStudentId;

    // Required field validation (avoid generic 500s from schema validation)
    if (!studentId || !academicYear || !gender || !homePincode) {
      return res.status(400).json({ message: 'Student ID, academic year, gender, and home pincode are required.' });
    }

    if (!['FY', 'SY', 'TY', 'BTech'].includes(academicYear)) {
      return res.status(400).json({ message: 'Invalid academic year. Allowed values: FY, SY, TY, BTech.' });
    }

    if (!['M', 'F'].includes(gender)) {
      return res.status(400).json({ message: 'Invalid gender. Allowed values: M or F.' });
    }

    if (!/^\d{6}$/.test(homePincode)) {
      return res.status(400).json({ message: 'Home pincode must be a valid 6-digit number.' });
    }

    if (academicYear === 'FY') {
      const rank = Number(mhtCetRank);
      if (!Number.isFinite(rank) || rank <= 0) {
        return res.status(400).json({ message: 'MHT-CET rank is required for FY and must be a positive number.' });
      }
      mhtCetRank = rank;
    }

    // Validation: Can't request self
    if (requestedRoommateId && isOwnedStudentId(authStudentId, requestedRoommateId)) {
      return res.status(400).json({ message: "You cannot request yourself as a roommate." });
    }

    // Validation: FY students cannot request roommates
    if (academicYear === 'FY' && requestedRoommateId) {
      return res.status(400).json({ message: "First-year students cannot request specific roommates." });
    }

    // Check for duplicate applications
    const ownedStudentQuery = getOwnedStudentMatchQuery(authStudentId);
    const existingApp = ownedStudentQuery ? await Application.findOne(ownedStudentQuery) : null;

    if (existingApp) {
      return res.status(400).json({ message: "You have already submitted a hostel application." });
    }

    const distance = await getDistanceFromVJTI(homePincode);
    let initialStatus = 'PENDING';

    // Distance eligibility check (must be > 50km to be eligible)
    if (distance <= 50) {
      initialStatus = 'REJECTED_DISTANCE';
    } else if (academicYear === 'FY') {
      // FY students always go to READY_FOR_ALLOTMENT (no roommate requests)
      initialStatus = 'READY_FOR_ALLOTMENT';
    } else if (requestedRoommateId) {
      // --- IMPROVED AUTO-HANDSHAKE ENGINE ---
      // First check if the requested partner exists at all
      const partnerApp = await Application.findOne({
        studentId: requestedRoommateId
      });

      if (partnerApp) {
        // Check gender compatibility BEFORE any matching
        if (partnerApp.gender !== gender) {
          return res.status(400).json({
            message: `Cannot match with ${requestedRoommateId}: Gender mismatch. Both students must be the same gender.`
          });
        }

        // Check academic year compatibility (both must be seniors)
        if (partnerApp.academicYear === 'FY') {
          return res.status(400).json({
            message: `Cannot match with ${requestedRoommateId}: First Year students cannot be requested as roommates.`
          });
        }

        // Check if partner is already allotted
        if (partnerApp.status === 'ALLOTTED') {
          return res.status(400).json({
            message: `Cannot match with ${requestedRoommateId}: They have already been allotted a room.`
          });
        }

        // Check if partner is rejected
        if (partnerApp.status === 'REJECTED_DISTANCE') {
          return res.status(400).json({
            message: `Cannot match with ${requestedRoommateId}: They are not eligible for hostel accommodation.`
          });
        }

        // Check if partner requested us back (mutual match)
        if (partnerApp.requestedRoommateId === studentId && 
            (partnerApp.status === 'WAITING_FOR_PARTNER' || partnerApp.status === 'READY_FOR_ALLOTMENT')) {
          // MUTUAL MATCH FOUND - Update partner immediately
          partnerApp.status = 'READY_FOR_ALLOTMENT';
          partnerApp.roommateAcceptedBy = studentId;
          await partnerApp.save();
          
          // Current applicant also gets matched immediately
          initialStatus = 'READY_FOR_ALLOTMENT';
          // roommateAcceptedBy will be set on the new application below
        } else {
          // Partner hasn't requested us back - wait for them
          initialStatus = 'WAITING_FOR_PARTNER';
        }
      } else {
        // Partner hasn't applied yet - wait for them
        initialStatus = 'WAITING_FOR_PARTNER';
      }
    } else {
      // Senior with no roommate request - goes to general pool
      initialStatus = 'READY_FOR_ALLOTMENT';
    }

    // Set roommateAcceptedBy if we got matched
    const wasMatched = initialStatus === 'READY_FOR_ALLOTMENT' && requestedRoommateId;

    // Create new application
    const newApplication = new Application({
      studentId,
      academicYear,
      gender,
      mhtCetRank: academicYear === 'FY' ? mhtCetRank : undefined,
      homePincode,
      distanceFromCollege: distance,
      requestedRoommateId: academicYear !== 'FY' ? requestedRoommateId : null,
      roommateAcceptedBy: wasMatched ? requestedRoommateId : null,
      status: initialStatus
    });

    await newApplication.save();

    res.status(201).json({
      message: initialStatus === 'READY_FOR_ALLOTMENT' && requestedRoommateId
        ? "✅ Auto-Match Successful! You and your partner are ready for allotment."
        : initialStatus === 'REJECTED_DISTANCE'
        ? "❌ Not eligible: Your home is within 50km of the college."
        : "✅ Application submitted successfully.",
      status: initialStatus,
      distance: Math.round(distance),
      application: newApplication
    });

  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.acceptRoommateRequest = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ message: 'Unable to resolve authenticated student.' });
    }

    let { currentStudentId, requesterId } = req.body;
    currentStudentId = normalizeStudentId(currentStudentId);
    requesterId = normalizeStudentId(requesterId);

    if (!requesterId) {
      return res.status(400).json({ message: 'Requester ID is required.' });
    }

    if (currentStudentId && !isOwnedStudentId(authStudentId, currentStudentId)) {
      return res.status(403).json({ message: 'You can only accept requests for your own account.' });
    }

    if (isOwnedStudentId(authStudentId, requesterId)) {
      return res.status(400).json({ message: 'You cannot match with yourself.' });
    }

    const currentStudentQuery = getOwnedStudentMatchQuery(authStudentId);

    // Fetch both applications
    const currentApp = currentStudentQuery ? await Application.findOne(currentStudentQuery) : null;
    const requesterApp = await Application.findOne({ studentId: requesterId });

    if (!currentApp || !requesterApp) {
      return res.status(404).json({ message: "One or both applications not found." });
    }

    currentStudentId = currentApp.studentId;

    // Check gender compatibility IMMEDIATELY
    if (currentApp.gender !== requesterApp.gender) {
      return res.status(400).json({ message: "Cross-gender roommate requests are prohibited." });
    }

    // FY students cannot have roommate logic
    if (currentApp.academicYear === 'FY' || requesterApp.academicYear === 'FY') {
      return res.status(400).json({ message: "First Year students cannot request roommates." });
    }

    // Verify the requester actually requested the current student
    if (requesterApp.requestedRoommateId !== currentStudentId) {
      return res.status(400).json({
        message: `Mismatch: ${requesterId} requested '${requesterApp.requestedRoommateId}', not you.`
      });
    }

    // Requester must be in WAITING_FOR_PARTNER status
    if (requesterApp.status !== 'WAITING_FOR_PARTNER') {
      return res.status(400).json({ message: "Requester is no longer available for matching." });
    }

    // Only accept if current student hasn't already been allotted
    if (currentApp.status === 'ALLOTTED' || currentApp.status === 'REJECTED_DISTANCE') {
      return res.status(400).json({ message: "You are no longer eligible to accept new roommates." });
    }

    // NOW DO THE MATCHING - Handle both cases
    // Case 1: Current student already requested this person
    if (currentApp.requestedRoommateId === requesterId) {
      // They requested each other - mutual match!
      currentApp.status = 'READY_FOR_ALLOTMENT';
      currentApp.roommateAcceptedBy = requesterId;
    } else {
      // One-way match: set the requester as current's roommate
      currentApp.requestedRoommateId = requesterId;
      currentApp.status = 'READY_FOR_ALLOTMENT';
      currentApp.roommateAcceptedBy = requesterId;
    }

    // Update requester to READY_FOR_ALLOTMENT and track who accepted
    requesterApp.status = 'READY_FOR_ALLOTMENT';
    requesterApp.roommateAcceptedBy = currentStudentId;

    // Save both atomically (or as close as possible)
    await requesterApp.save();
    await currentApp.save();

    res.status(200).json({
      message: `✅ Roommate match successful! You and ${requesterId} are ready for allotment.`,
      status: 'READY_FOR_ALLOTMENT',
      partner: requesterId
    });

  } catch (error) {
    console.error("Error accepting roommate:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.cancelRoommateRequest = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ message: 'Unable to resolve authenticated student.' });
    }

    let { studentId } = req.body;
    studentId = normalizeStudentId(studentId);

    if (studentId && !isOwnedStudentId(authStudentId, studentId)) {
      return res.status(403).json({ message: 'You can only cancel your own roommate request.' });
    }

    const ownedStudentQuery = getOwnedStudentMatchQuery(authStudentId);

    const app = ownedStudentQuery ? await Application.findOne(ownedStudentQuery) : null;
    if (!app) {
      return res.status(404).json({ message: "Application not found." });
    }

    studentId = app.studentId;

    if (app.status !== 'WAITING_FOR_PARTNER') {
      return res.status(400).json({ message: "You have no pending requests to cancel." });
    }

    // Revert to general single allotment pool
    app.requestedRoommateId = null;
    app.roommateAcceptedBy = null;
    app.status = 'READY_FOR_ALLOTMENT';
    await app.save();

    res.status(200).json({
      message: "✅ Request cancelled. You are now in the general allotment pool.",
      status: 'READY_FOR_ALLOTMENT'
    });

  } catch (error) {
    console.error("Error cancelling request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Decline an incoming roommate request
 * Notifies the requester that their request was declined
 */
exports.declineRoommateRequest = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ message: 'Unable to resolve authenticated student.' });
    }

    let { currentStudentId, requesterId } = req.body;
    currentStudentId = normalizeStudentId(currentStudentId);
    requesterId = normalizeStudentId(requesterId);

    if (!requesterId) {
      return res.status(400).json({ message: 'Requester ID is required.' });
    }

    if (currentStudentId && !isOwnedStudentId(authStudentId, currentStudentId)) {
      return res.status(403).json({ message: 'You can only decline requests for your own account.' });
    }

    const currentStudentQuery = getOwnedStudentMatchQuery(authStudentId);
    const currentApp = currentStudentQuery ? await Application.findOne(currentStudentQuery) : null;
    if (!currentApp) {
      return res.status(404).json({ message: 'Application not found for current student.' });
    }

    currentStudentId = currentApp.studentId;

    // Find the requester's application
    const requesterApp = await Application.findOne({ studentId: requesterId });
    if (!requesterApp) {
      return res.status(404).json({ message: "Requester application not found." });
    }

    // Verify the requester actually requested the current student
    if (requesterApp.requestedRoommateId !== currentStudentId) {
      return res.status(400).json({ message: "This person did not request you as a roommate." });
    }

    // Requester must be in WAITING_FOR_PARTNER status
    if (requesterApp.status !== 'WAITING_FOR_PARTNER') {
      return res.status(400).json({ message: "This request is no longer pending." });
    }

    // Move requester to general pool (their request was declined)
    requesterApp.requestedRoommateId = null;
    requesterApp.status = 'READY_FOR_ALLOTMENT';
    await requesterApp.save();

    res.status(200).json({
      message: `✅ Request from ${requesterId} declined. They have been moved to the general allotment pool.`
    });

  } catch (error) {
    console.error("Error declining request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Withdraw application entirely
 * Only allowed if not yet ALLOTTED
 */
exports.withdrawApplication = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ message: 'Unable to resolve authenticated student.' });
    }

    let { studentId } = req.body;
    studentId = normalizeStudentId(studentId);

    if (studentId && !isOwnedStudentId(authStudentId, studentId)) {
      return res.status(403).json({ message: 'You can only withdraw your own application.' });
    }

    const ownedStudentQuery = getOwnedStudentMatchQuery(authStudentId);

    const app = ownedStudentQuery ? await Application.findOne(ownedStudentQuery) : null;
    if (!app) {
      return res.status(404).json({ message: "Application not found." });
    }

    studentId = app.studentId;

    // Can't withdraw if already allotted
    if (app.status === 'ALLOTTED') {
      return res.status(400).json({ 
        message: "Cannot withdraw - you have already been allotted a room. Please contact the hostel office." 
      });
    }

    // Clear roommate links from any other applications pointing to this student
    const impactedApps = await Application.find({
      studentId: { $ne: studentId },
      $or: [
        { requestedRoommateId: studentId },
        { roommateAcceptedBy: studentId }
      ]
    });

    for (const impacted of impactedApps) {
      if (impacted.requestedRoommateId === studentId) {
        impacted.requestedRoommateId = null;
      }

      if (impacted.roommateAcceptedBy === studentId) {
        impacted.roommateAcceptedBy = null;
      }

      // If they were waiting for a partner who withdrew, move them to general pool
      if (impacted.status === 'WAITING_FOR_PARTNER' && !impacted.requestedRoommateId) {
        impacted.status = 'READY_FOR_ALLOTMENT';
      }

      await impacted.save();
    }

    // Delete the application
    await Application.deleteOne({ studentId });

    res.status(200).json({
      message: "✅ Application withdrawn successfully. You can submit a new application if needed."
    });

  } catch (error) {
    console.error("Error withdrawing application:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getStudentDashboard = async (req, res) => {
  try {
    const authStudentId = getAuthStudentId(req);
    if (!authStudentId) {
      return res.status(401).json({ message: 'Unable to resolve authenticated student.' });
    }

    let { studentId } = req.params;
    studentId = normalizeStudentId(studentId);

    if (studentId && !isOwnedStudentId(authStudentId, studentId)) {
      return res.status(403).json({ message: 'You can only access your own dashboard.' });
    }

    const ownedStudentQuery = getOwnedStudentMatchQuery(authStudentId);

    // Fetch own application with room details
    const myApp = ownedStudentQuery
      ? await Application.findOne(ownedStudentQuery).populate('allottedRoom')
      : null;

    const effectiveStudentId = myApp?.studentId || authStudentId;
    const incomingRequestClause = getOwnedIdClause('requestedRoommateId', authStudentId) || { requestedRoommateId: effectiveStudentId };

    // Fetch incoming roommate requests
    const incomingRequests = await Application.find({
      ...incomingRequestClause,
      status: 'WAITING_FOR_PARTNER'
    });

    let roommates = [];
    if (myApp && myApp.status === 'ALLOTTED' && myApp.allottedRoom) {
      // Get all other occupants in the room
      roommates = (myApp.allottedRoom.occupants || []).filter(
        id => !isOwnedStudentId(authStudentId, id)
      );
    }

    // SMART FEATURE: Suggest available roommates (same gender, same year group, in READY_FOR_ALLOTMENT without a request)
    let roommatesSuggestions = [];
    if (myApp && myApp.academicYear !== 'FY' && 
        (myApp.status === 'READY_FOR_ALLOTMENT' || myApp.status === 'WAITING_FOR_PARTNER') &&
        !myApp.roommateAcceptedBy) {
      roommatesSuggestions = await Application.find({
        studentId: { $ne: effectiveStudentId },
        gender: myApp.gender,
        academicYear: { $ne: 'FY' },
        status: 'READY_FOR_ALLOTMENT',
        requestedRoommateId: null,  // They haven't requested anyone
        roommateAcceptedBy: null    // They aren't already matched
      }).limit(5).select('studentId academicYear');
    }

    res.status(200).json({
      application: myApp,
      incomingRequests: incomingRequests.map(req => req.studentId),
      roommates: roommates,
      distance: myApp?.distanceFromCollege || null,
      suggestions: roommatesSuggestions.map(s => ({
        studentId: s.studentId,
        academicYear: s.academicYear
      }))
    });

  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
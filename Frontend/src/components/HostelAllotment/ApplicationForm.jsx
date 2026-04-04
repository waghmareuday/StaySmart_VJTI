import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import myHook from '../Context';

function ApplicationForm() {
  const { user } = myHook();
  
  const [formData, setFormData] = useState({
    studentId: '',
    academicYear: 'FY',
    gender: 'M',
    mhtCetRank: '',
    homePincode: '',
    requestedRoommateId: ''
  });

  const [loading, setLoading] = useState(false);
  const [existingApp, setExistingApp] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [roommatesSuggestions, setRoommatesSuggestions] = useState([]);

  // Populate student ID from context (user.studentId or user.collegeId from login)
  useEffect(() => {
    if (user?.studentId) {
      setFormData(prev => ({ ...prev, studentId: user.studentId }));
    } else if (user?.collegeId) {
      setFormData(prev => ({ ...prev, studentId: String(user.collegeId) }));
    }
    // If no user is logged in, allow manual entry and stop loading
    if (!user) {
      setCheckingStatus(false);
    }
  }, [user]);

  // Check if student already has an application
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!formData.studentId) {
        setCheckingStatus(false);
        return;
      }

      try {
        const response = await axios.get(API_ENDPOINTS.GET_DASHBOARD(formData.studentId));
        if (response.data.application) {
          setExistingApp(response.data.application);
          setIncomingRequests(response.data.incomingRequests || []);
          setRoommatesSuggestions(response.data.suggestions || []);
        }
      } catch {
        // No existing application found - that's okay
        console.log('No existing application');
      }
      setCheckingStatus(false);
    };

    // Only check if we have a studentId
    if (formData.studentId) {
      checkExistingApplication();
    } else {
      // No studentId yet - stop loading to show form
      setCheckingStatus(false);
    }
  }, [formData.studentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.studentId.trim()) {
      alert('Please enter your Student ID / Roll Number');
      setLoading(false);
      return;
    }

    if (!formData.homePincode.trim() || formData.homePincode.length !== 6) {
      alert('Please enter a valid 6-digit pincode');
      setLoading(false);
      return;
    }

    if (formData.academicYear === 'FY' && !formData.mhtCetRank) {
      alert('Please enter your MHT-CET Rank (required for First Year students)');
      setLoading(false);
      return;
    }

    // Build submission payload
    const payload = {
      studentId: formData.studentId.trim().toUpperCase(),
      academicYear: formData.academicYear,
      gender: formData.gender,
      homePincode: formData.homePincode.trim(),
      mhtCetRank: formData.academicYear === 'FY' ? parseInt(formData.mhtCetRank) : undefined,
      requestedRoommateId: formData.academicYear !== 'FY' && formData.requestedRoommateId.trim() 
        ? formData.requestedRoommateId.trim().toUpperCase() 
        : null
    };

    try {
      const response = await axios.post(API_ENDPOINTS.SUBMIT_APPLICATION, payload);
      alert(`✅ ${response.data.message}\n\nYour distance from VJTI: ${response.data.distance} km\nStatus: ${response.data.status.replace(/_/g, ' ')}`);
      
      // Refresh to show status
      setExistingApp(response.data.application);
    } catch (error) {
      alert(`❌ Error: ${error.response?.data?.message || 'Failed to submit application'}`);
    }

    setLoading(false);
  };

  const handleAcceptRequest = async (requesterId) => {
    if (processingRequest) return;
    setProcessingRequest(requesterId);

    try {
      const response = await axios.post(API_ENDPOINTS.ACCEPT_ROOMMATE, {
        currentStudentId: formData.studentId,
        requesterId: requesterId
      });
      alert(`✅ ${response.data.message}`);
      
      // Refresh application status
      const dashResponse = await axios.get(API_ENDPOINTS.GET_DASHBOARD(formData.studentId));
      setExistingApp(dashResponse.data.application);
      setIncomingRequests(dashResponse.data.incomingRequests || []);
    } catch (error) {
      alert(`❌ Error: ${error.response?.data?.message || 'Failed to accept request'}`);
    }

    setProcessingRequest(null);
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel your roommate request? You will be placed in the general allotment pool.')) {
      return;
    }

    try {
      const response = await axios.post(API_ENDPOINTS.CANCEL_ROOMMATE, {
        studentId: formData.studentId
      });
      alert(`✅ ${response.data.message}`);
      
      // Refresh
      const dashResponse = await axios.get(API_ENDPOINTS.GET_DASHBOARD(formData.studentId));
      setExistingApp(dashResponse.data.application);
    } catch (error) {
      alert(`❌ Error: ${error.response?.data?.message || 'Failed to cancel request'}`);
    }
  };

  const handleDeclineRequest = async (requesterId) => {
    if (!window.confirm(`Are you sure you want to decline ${requesterId}'s roommate request?`)) {
      return;
    }
    
    if (processingRequest) return;
    setProcessingRequest(requesterId);

    try {
      const response = await axios.post(API_ENDPOINTS.DECLINE_ROOMMATE, {
        currentStudentId: formData.studentId,
        requesterId: requesterId
      });
      alert(`✅ ${response.data.message}`);
      
      // Refresh application status
      const dashResponse = await axios.get(API_ENDPOINTS.GET_DASHBOARD(formData.studentId));
      setExistingApp(dashResponse.data.application);
      setIncomingRequests(dashResponse.data.incomingRequests || []);
    } catch (error) {
      alert(`❌ Error: ${error.response?.data?.message || 'Failed to decline request'}`);
    }

    setProcessingRequest(null);
  };

  const handleWithdrawApplication = async () => {
    const confirm1 = window.confirm('⚠️ Are you sure you want to withdraw your application?\n\nThis action cannot be undone.');
    if (!confirm1) return;
    
    const confirm2 = window.prompt("Type 'WITHDRAW' to confirm:");
    if (confirm2 !== 'WITHDRAW') {
      alert("Withdrawal cancelled.");
      return;
    }

    try {
      const response = await axios.post(API_ENDPOINTS.WITHDRAW_APPLICATION, {
        studentId: formData.studentId
      });
      alert(`✅ ${response.data.message}`);
      setExistingApp(null);
      setIncomingRequests([]);
    } catch (error) {
      alert(`❌ Error: ${error.response?.data?.message || 'Failed to withdraw application'}`);
    }
  };

  // Loading state
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center pt-20">
        <div className="text-white text-xl">Checking application status...</div>
      </div>
    );
  }

  // If already has application - show status
  if (existingApp) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 sm:p-6 md:p-8 pt-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Hostel Room Allotment</h1>

          {/* Incoming Requests */}
          {incomingRequests.length > 0 && (
            <div className="mb-8 space-y-4">
              <h2 className="text-xl font-bold text-yellow-400">🔔 Incoming Roommate Requests</h2>
              {incomingRequests.map((requesterId, idx) => (
                <div key={idx} className="bg-yellow-900/30 border border-yellow-600 rounded-xl p-4 sm:p-6 flex flex-col md:flex-row gap-4 md:justify-between md:items-center">
                  <div>
                    <p className="text-gray-200">
                      <span className="font-bold text-white">{requesterId}</span> wants to be your roommate
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(requesterId)}
                      disabled={processingRequest === requesterId}
                      className={`px-6 py-2 font-bold rounded-lg transition ${
                        processingRequest === requesterId
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-yellow-500 text-black hover:bg-yellow-400'
                      }`}
                    >
                      {processingRequest === requesterId ? 'Processing...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(requesterId)}
                      disabled={processingRequest === requesterId}
                      className={`px-6 py-2 font-bold rounded-lg transition ${
                        processingRequest === requesterId
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600/20 text-red-400 border border-red-500 hover:bg-red-600 hover:text-white'
                      }`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Application Status Card */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 border border-gray-700 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Your Application</h2>
                <p className="text-gray-400">
                  {existingApp.academicYear} | {existingApp.gender === 'M' ? 'Male' : 'Female'} | 
                  Distance: {existingApp.distanceFromCollege} km
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full font-bold text-sm
                ${existingApp.status === 'REJECTED_DISTANCE' ? 'bg-red-500/20 text-red-400' : ''}
                ${existingApp.status === 'WAITING_FOR_PARTNER' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                ${existingApp.status === 'READY_FOR_ALLOTMENT' ? 'bg-blue-500/20 text-blue-400' : ''}
                ${existingApp.status === 'ALLOTTED' ? 'bg-green-500/20 text-green-400' : ''}
                ${existingApp.status === 'PENDING' ? 'bg-gray-500/20 text-gray-400' : ''}
              `}>
                {existingApp.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Status explanations */}
            {existingApp.status === 'REJECTED_DISTANCE' && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <p className="text-red-400">
                  ❌ Your application was rejected because your home address is within 50km of VJTI. 
                  Only students living more than 50km away are eligible for hostel accommodation.
                </p>
              </div>
            )}

            {existingApp.status === 'WAITING_FOR_PARTNER' && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-300 mb-4">
                  ⏳ Waiting for <span className="font-bold">{existingApp.requestedRoommateId}</span> to apply and accept your request.
                </p>
                <button
                  onClick={handleCancelRequest}
                  className="px-4 py-2 bg-red-600/20 border border-red-500 text-red-400 rounded hover:bg-red-600 hover:text-white transition text-sm"
                >
                  Cancel Request
                </button>
              </div>
            )}

            {existingApp.status === 'READY_FOR_ALLOTMENT' && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <p className="text-blue-300">
                  ✅ Your application is in the queue! Room allotment will be processed by the admin soon.
                  {existingApp.roommateAcceptedBy && (
                    <span className="block mt-2">
                      You are matched with: <span className="font-bold text-white">{existingApp.roommateAcceptedBy}</span>
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Smart Roommate Suggestions - Only for seniors without a match */}
            {existingApp.academicYear !== 'FY' && 
             !existingApp.roommateAcceptedBy && 
             roommatesSuggestions.length > 0 && (
              <div className="mt-4 bg-purple-900/20 border border-purple-700 rounded-lg p-4">
                <h3 className="text-purple-400 font-bold mb-3">💡 Suggested Roommates</h3>
                <p className="text-gray-400 text-sm mb-3">
                  These students are looking for roommates. Contact them outside this portal to coordinate!
                </p>
                <div className="flex flex-wrap gap-2">
                  {roommatesSuggestions.map((suggestion, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-800/30 border border-purple-600 rounded-full text-purple-300 text-sm">
                      {suggestion.studentId} ({suggestion.academicYear})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {existingApp.status === 'ALLOTTED' && existingApp.allottedRoom && (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <p className="text-green-300 text-2xl font-bold mb-2">
                  🎉 Room {existingApp.allottedRoom.roomNumber}
                </p>
                <p className="text-gray-300">
                  Block: {existingApp.allottedRoom.block} | 
                  Floor: {existingApp.allottedRoom.floor} | 
                  Capacity: {existingApp.allottedRoom.capacity}
                </p>
              </div>
            )}

            {/* Additional info */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Student ID:</span>
                  <span className="ml-2 text-white font-mono">{existingApp.studentId}</span>
                </div>
                {existingApp.mhtCetRank && (
                  <div>
                    <span className="text-gray-500">CET Rank:</span>
                    <span className="ml-2 text-white">{existingApp.mhtCetRank}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Home Pincode:</span>
                  <span className="ml-2 text-white">{existingApp.homePincode}</span>
                </div>
                {existingApp.requestedRoommateId && (
                  <div>
                    <span className="text-gray-500">Requested Roommate:</span>
                    <span className="ml-2 text-white">{existingApp.requestedRoommateId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Withdraw Application - Only show if not yet ALLOTTED */}
            {existingApp.status !== 'ALLOTTED' && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={handleWithdrawApplication}
                  className="w-full py-3 bg-red-900/20 border border-red-700 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition text-sm font-medium"
                >
                  Withdraw Application
                </button>
                <p className="text-gray-500 text-xs mt-2 text-center">
                  This will delete your application. You can submit a new one afterwards.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Application Form
  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 md:p-8 pt-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Hostel Room Allotment Application</h1>
          <p className="text-gray-400">Fill out this form to apply for hostel accommodation</p>
        </div>

        {/* Eligibility Info */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-6 mb-8">
          <h3 className="text-blue-400 font-bold mb-2">📋 Eligibility Criteria</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• You must live more than 50km from VJTI campus</li>
            <li>• First Year (FY) students: Allotment based on MHT-CET rank</li>
            <li>• Senior students (SY/TY/BTech): Can request a specific roommate</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 border border-gray-700 shadow-xl">
          {/* Student ID */}
          <div className="mb-6">
            <label className="block text-gray-300 font-medium mb-2">Student ID / Roll Number *</label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="e.g., 211080001"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Academic Year */}
          <div className="mb-6">
            <label className="block text-gray-300 font-medium mb-2">Academic Year *</label>
            <select
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="FY">First Year (FY)</option>
              <option value="SY">Second Year (SY)</option>
              <option value="TY">Third Year (TY)</option>
              <option value="BTech">B.Tech (Final Year)</option>
            </select>
          </div>

          {/* Gender */}
          <div className="mb-6">
            <label className="block text-gray-300 font-medium mb-2">Gender *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="M"
                  checked={formData.gender === 'M'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-white">Male</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="F"
                  checked={formData.gender === 'F'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-white">Female</span>
              </label>
            </div>
          </div>

          {/* Home Pincode */}
          <div className="mb-6">
            <label className="block text-gray-300 font-medium mb-2">Home Pincode *</label>
            <input
              type="text"
              name="homePincode"
              value={formData.homePincode}
              onChange={handleChange}
              placeholder="6-digit pincode"
              maxLength={6}
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              required
            />
            <p className="text-gray-500 text-sm mt-1">Your distance from VJTI will be calculated automatically</p>
          </div>

          {/* MHT-CET Rank (only for FY) */}
          {formData.academicYear === 'FY' && (
            <div className="mb-6">
              <label className="block text-gray-300 font-medium mb-2">MHT-CET Rank *</label>
              <input
                type="number"
                name="mhtCetRank"
                value={formData.mhtCetRank}
                onChange={handleChange}
                placeholder="Your CET rank"
                min={1}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                required
              />
              <p className="text-gray-500 text-sm mt-1">Room allotment priority is based on CET rank (lower rank = higher priority)</p>
            </div>
          )}

          {/* Roommate Request (only for seniors) */}
          {formData.academicYear !== 'FY' && (
            <div className="mb-6">
              <label className="block text-gray-300 font-medium mb-2">Preferred Roommate (Optional)</label>
              <input
                type="text"
                name="requestedRoommateId"
                value={formData.requestedRoommateId}
                onChange={handleChange}
                placeholder="Enter their Student ID"
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
              <p className="text-gray-500 text-sm mt-1">
                Both students must request each other to be matched. Leave empty for random assignment.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold text-lg transition ${
              loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ApplicationForm;

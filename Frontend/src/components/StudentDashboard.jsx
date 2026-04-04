import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import myHook from './Context';

function StudentDashboard({ user: userProp }) {
  const { user: contextUser } = myHook();
  const user = userProp || contextUser;
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); // Track which request is being processed
  const debounceTimers = useRef({});

  // Auto-fetch data when component mounts
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get(
          API_ENDPOINTS.GET_DASHBOARD(user.studentId)
        );
        setDashboardData(response.data);
      } catch (error) {
        setDashboardData(null);
      }
      setLoading(false);
    };

    if (user?.studentId) {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Debounced accept roommate handler - prevents double-clicks
  const handleAcceptRoommate = async (requesterId) => {
    if (processingId === requesterId) return; // Already processing this one

    // Cancel any pending timer for this requesterId
    if (debounceTimers.current[requesterId]) {
      clearTimeout(debounceTimers.current[requesterId]);
    }

    setProcessingId(requesterId);

    try {
      const response = await axios.post(
        API_ENDPOINTS.ACCEPT_ROOMMATE,
        {
          currentStudentId: user.studentId,
          requesterId: requesterId,
        }
      );
      alert(`✅ ${response.data.message}`);
      // Refresh dashboard
      const dashResponse = await axios.get(
        API_ENDPOINTS.GET_DASHBOARD(user.studentId)
      );
      setDashboardData(dashResponse.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Error accepting request.');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle cancel pending roommate request
  const handleCancelRequest = async () => {
    if (!window.confirm("Are you sure you want to cancel this request? You will be placed in the random allotment pool.")) {
      return;
    }

    try {
      const response = await axios.post(
        API_ENDPOINTS.CANCEL_ROOMMATE,
        {
          studentId: user.studentId
        }
      );
      alert(`✅ ${response.data.message}`);
      // Refresh dashboard
      const dashResponse = await axios.get(
        API_ENDPOINTS.GET_DASHBOARD(user.studentId)
      );
      setDashboardData(dashResponse.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling request.');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex justify-center items-center text-white pt-20">Loading your allotment status...</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">Hostel Allotment Portal</h1>

        {/* INCOMING ROOMMATE REQUESTS */}
        {dashboardData?.incomingRequests?.length > 0 && (
          <div className="mb-8 space-y-4">
            {dashboardData.incomingRequests.map((requesterId, idx) => (
              <div
                key={idx}
                  className="bg-yellow-900/40 border border-yellow-500 rounded-xl p-4 sm:p-6 flex flex-col md:flex-row gap-4 md:justify-between md:items-center shadow-2xl"
              >
                <div>
                  <h3 className="text-yellow-400 font-bold text-xl mb-1 flex items-center gap-2">
                    🔔 Roommate Request!
                  </h3>
                  <p className="text-gray-200">
                    Student <span className="font-extrabold text-white bg-gray-800 px-2 py-1 rounded">{requesterId}</span> has requested you as their roommate.
                  </p>
                </div>

                {!dashboardData.application ? (
                  <div className="md:text-right">
                    <p className="text-sm text-yellow-300 mb-2 italic">Step 1: Fill out your form to proceed</p>
                    <button
                      onClick={() => navigate('/RoomAllotment')}
                      className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition shadow-lg"
                    >
                      Go to Application Form
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAcceptRoommate(requesterId)}
                    disabled={processingId === requesterId}
                    className={`px-6 py-3 font-extrabold rounded-lg transition shadow-xl transform hover:scale-105 ${
                      processingId === requesterId
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        : 'bg-yellow-500 text-black hover:bg-yellow-400'
                    }`}
                  >
                    {processingId === requesterId ? 'Processing...' : 'Accept Match'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* APPLICATION STATUS */}
        {dashboardData?.application ? (
          <div className="bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-2">My Application</h2>
            <p className="text-gray-400 mb-6">
              Year: {dashboardData.application.academicYear} | Distance: {dashboardData.distance && Math.round(dashboardData.distance)} km
            </p>

            <div className="bg-gray-700 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    Current Status
                  </h3>
                  <span
                    className={`px-4 py-2 rounded-full font-bold text-sm inline-block
                    ${dashboardData.application.status === 'REJECTED_DISTANCE' ? 'bg-red-500/20 text-red-400' : ''}
                    ${dashboardData.application.status === 'WAITING_FOR_PARTNER' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                    ${dashboardData.application.status === 'READY_FOR_ALLOTMENT' ? 'bg-blue-500/20 text-blue-400' : ''}
                    ${dashboardData.application.status === 'ALLOTTED' ? 'bg-green-500/20 text-green-400' : ''}
                  `}
                  >
                    {dashboardData.application.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Cancel Request Button */}
                {dashboardData.application.status === 'WAITING_FOR_PARTNER' && (
                  <button
                    onClick={handleCancelRequest}
                    className="px-4 py-2 bg-red-600/20 border border-red-500 text-red-400 font-semibold rounded hover:bg-red-600 hover:text-white transition text-sm"
                  >
                    Cancel Pending Request
                  </button>
                )}
              </div>

              {/* ALLOTTED ROOM INFORMATION */}
              {dashboardData.application.status === 'ALLOTTED' && dashboardData.application.allottedRoom && (
                <div className="mt-6 p-5 border border-green-500/30 bg-green-900/20 rounded-lg">
                  <p className="text-green-300 font-bold text-2xl mb-1">
                    🎉 Room {dashboardData.application.allottedRoom.roomNumber}
                  </p>
                  <p className="text-gray-400 mb-4">
                    Block: {dashboardData.application.allottedRoom.block} | Floor: {dashboardData.application.allottedRoom.floor} | Capacity: {dashboardData.application.allottedRoom.capacity}
                  </p>

                  <div className="border-t border-green-800/50 pt-4">
                    <p className="text-sm text-green-400/80 mb-2 font-semibold">👥 Your Roommates:</p>
                    {dashboardData.roommates && dashboardData.roommates.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {dashboardData.roommates.map((rm, i) => (
                          <span key={i} className="px-3 py-1 bg-gray-800 border border-green-700 rounded text-gray-200 font-medium text-sm">
                            {rm}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">You are currently alone in this room.</span>
                    )}
                  </div>
                </div>
              )}

              {/* REJECTION REASON */}
              {dashboardData.application.status === 'REJECTED_DISTANCE' && (
                <div className="mt-6 p-5 border border-red-500/30 bg-red-900/20 rounded-lg">
                  <p className="text-red-400 font-bold text-lg">❌ Not Eligible for Hostel</p>
                  <p className="text-gray-300 text-sm mt-2">
                    Your home is within 50km of the college. You are not eligible for hostel accommodation.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 md:p-10 border border-gray-700 flex flex-col items-center text-center">
            <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">
              No Application Found
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
              You haven't submitted a hostel application for this academic year yet. Click below to start the process.
            </p>
            <button
              onClick={() => navigate('/RoomAllotment')}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              Fill Application Form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import myHook from '../Context';
import { API_ENDPOINTS } from '../../config/api';
import { FaExchangeAlt, FaPaperPlane, FaCheck, FaTimes, FaClock, FaUsers } from 'react-icons/fa';

function RoomSwap() {
  const { user } = myHook();
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [eligibleTargets, setEligibleTargets] = useState([]);
  const [myRequests, setMyRequests] = useState({ outgoing: [], incoming: [] });
  
  // Form state
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const studentId = user?.studentId;

  // Fetch eligible swap targets
  const fetchEligibleTargets = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.SWAP_ELIGIBLE_TARGETS(studentId));
      setEligibleTargets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch my swap requests
  const fetchMyRequests = async () => {
    if (!studentId) return;
    try {
      const response = await axios.get(API_ENDPOINTS.SWAP_MY_REQUESTS(studentId));
      setMyRequests(response.data.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchEligibleTargets();
      fetchMyRequests();
    }
  }, [studentId]);

  // Submit swap request
  const handleSubmitRequest = async () => {
    if (!selectedTarget || !reason.trim()) {
      alert('Please select a student and provide a reason');
      return;
    }

    try {
      setLoading(true);
      await axios.post(API_ENDPOINTS.SWAP_REQUEST, {
        requesterId: studentId,
        requesterName: user?.name || studentId,
        targetId: selectedTarget.studentId,
        reason: reason.trim()
      });
      alert('Swap request sent successfully!');
      setSelectedTarget(null);
      setReason('');
      fetchMyRequests();
      setActiveTab('my-requests');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  // Respond to incoming request
  const handleRespond = async (requestId, accept) => {
    try {
      setLoading(true);
      await axios.post(API_ENDPOINTS.SWAP_RESPOND(requestId), {
        studentId,
        accept,
        message: accept ? 'I accept the swap!' : 'Sorry, I cannot swap at this time.'
      });
      alert(accept ? 'Request accepted! Waiting for admin approval.' : 'Request declined.');
      fetchMyRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to respond');
    } finally {
      setLoading(false);
    }
  };

  // Cancel outgoing request
  const handleCancel = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
      setLoading(true);
      await axios.post(API_ENDPOINTS.SWAP_CANCEL(requestId), { studentId });
      alert('Request cancelled');
      fetchMyRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  // Filter targets by search
  const filteredTargets = eligibleTargets.filter(t => 
    t.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.allottedRoom?.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'PENDING': { color: 'yellow', text: 'Awaiting Response' },
      'TARGET_ACCEPTED': { color: 'blue', text: 'Awaiting Admin' },
      'TARGET_REJECTED': { color: 'red', text: 'Declined' },
      'ADMIN_APPROVED': { color: 'green', text: 'Approved ✓' },
      'ADMIN_REJECTED': { color: 'red', text: 'Admin Rejected' },
      'CANCELLED': { color: 'gray', text: 'Cancelled' },
      'EXPIRED': { color: 'gray', text: 'Expired' }
    };
    const config = statusConfig[status] || { color: 'gray', text: status };
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold bg-${config.color}-500/20 text-${config.color}-400`}>
        {config.text}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 pt-24 flex items-center justify-center">
        <p className="text-gray-400">Please login to access room swap feature</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <FaExchangeAlt className="text-3xl text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Room Swap Request</h1>
          </div>
          <p className="text-gray-400">Request to swap your room with another student</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg w-fit mx-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'create' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaPaperPlane className="inline mr-2" />
            New Request
          </button>
          <button
            onClick={() => { setActiveTab('my-requests'); fetchMyRequests(); }}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'my-requests' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaUsers className="inline mr-2" />
            My Requests
            {myRequests.pendingIncoming > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {myRequests.pendingIncoming}
              </span>
            )}
          </button>
        </div>

        {/* Create Request Tab */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Target Selection */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Select Student to Swap With</h2>
              
              <input
                type="text"
                placeholder="Search by Student ID or Room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 bg-gray-900 rounded-lg text-white border border-gray-700 mb-4 focus:border-blue-500 outline-none"
              />

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading...</div>
                ) : filteredTargets.length > 0 ? (
                  filteredTargets.map((target) => (
                    <div
                      key={target._id}
                      onClick={() => setSelectedTarget(target)}
                      className={`p-4 rounded-lg cursor-pointer transition border ${
                        selectedTarget?._id === target._id
                          ? 'bg-blue-900/30 border-blue-500'
                          : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{target.studentId}</span>
                        <span className="text-yellow-400 font-medium">
                          Room {target.allottedRoom?.roomNumber}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {target.allottedRoom?.block} Block • Floor {target.allottedRoom?.floor}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No eligible students found. Students must be allotted and same gender.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Request Form */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Swap Details</h2>
              
              {selectedTarget ? (
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">You are requesting to swap with:</p>
                    <p className="text-xl font-bold text-white">{selectedTarget.studentId}</p>
                    <p className="text-yellow-400">Room {selectedTarget.allottedRoom?.roomNumber}</p>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Reason for swap request *
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., I need a room closer to the library, my current room has noise issues..."
                      rows={4}
                      maxLength={500}
                      className="w-full p-3 bg-gray-900 rounded-lg text-white border border-gray-700 focus:border-blue-500 outline-none resize-none"
                    />
                    <p className="text-gray-500 text-xs mt-1">{reason.length}/500 characters</p>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <p className="text-blue-400 text-sm">
                      <strong>How it works:</strong><br />
                      1. You send a request to the target student<br />
                      2. They can accept or decline<br />
                      3. If accepted, admin reviews and approves<br />
                      4. Once approved, rooms are swapped automatically
                    </p>
                  </div>

                  <button
                    onClick={handleSubmitRequest}
                    disabled={loading || !reason.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Swap Request'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <FaExchangeAlt className="text-4xl mb-4 opacity-50" />
                  <p>Select a student from the list to create a swap request</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'my-requests' && (
          <div className="space-y-6">
            {/* Incoming Requests */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaClock className="text-yellow-400" />
                Incoming Requests
                {myRequests.incoming?.filter(r => r.status === 'PENDING').length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {myRequests.incoming.filter(r => r.status === 'PENDING').length} pending
                  </span>
                )}
              </h2>

              {myRequests.incoming?.length > 0 ? (
                <div className="space-y-3">
                  {myRequests.incoming.map((req) => (
                    <div key={req._id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-white">From: {req.requesterId}</p>
                          <p className="text-sm text-gray-400">
                            Wants to swap their Room {req.requesterRoomNumber} with your Room {req.targetRoomNumber}
                          </p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-gray-300 text-sm bg-gray-800 p-2 rounded mb-3">
                        "{req.reason}"
                      </p>
                      {req.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(req._id, true)}
                            disabled={loading}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition"
                          >
                            <FaCheck className="inline mr-1" /> Accept
                          </button>
                          <button
                            onClick={() => handleRespond(req._id, false)}
                            disabled={loading}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition"
                          >
                            <FaTimes className="inline mr-1" /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No incoming swap requests</p>
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FaPaperPlane className="text-blue-400" />
                Outgoing Requests
              </h2>

              {myRequests.outgoing?.length > 0 ? (
                <div className="space-y-3">
                  {myRequests.outgoing.map((req) => (
                    <div key={req._id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-white">To: {req.targetId}</p>
                          <p className="text-sm text-gray-400">
                            Room {req.requesterRoomNumber} → Room {req.targetRoomNumber}
                          </p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-gray-300 text-sm mb-2">Reason: "{req.reason}"</p>
                      {req.targetResponse?.message && (
                        <p className="text-sm text-gray-400 italic">
                          Response: "{req.targetResponse.message}"
                        </p>
                      )}
                      {['PENDING', 'TARGET_ACCEPTED'].includes(req.status) && (
                        <button
                          onClick={() => handleCancel(req._id)}
                          disabled={loading}
                          className="mt-2 px-4 py-1.5 bg-red-900/50 text-red-400 rounded hover:bg-red-900 transition text-sm"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No outgoing swap requests</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomSwap;

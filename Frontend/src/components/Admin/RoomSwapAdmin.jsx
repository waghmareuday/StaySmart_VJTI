import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { FaExchangeAlt, FaCheck, FaTimes, FaClock, FaFilter } from 'react-icons/fa';

function RoomSwapAdmin() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('TARGET_ACCEPTED'); // Default to awaiting admin
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remarks, setRemarks] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.ADMIN_SWAP_REQUESTS, {
        params: { status: filter === 'ALL' ? undefined : filter }
      });
      setRequests(response.data.data || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching swap requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleDecision = async (requestId, approve) => {
    try {
      setLoading(true);
      await axios.post(API_ENDPOINTS.ADMIN_SWAP_DECISION(requestId), {
        approve,
        remarks: remarks.trim() || null,
        adminId: 'admin'
      });
      alert(approve ? 'Swap approved and executed!' : 'Swap request rejected.');
      setSelectedRequest(null);
      setRemarks('');
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to process decision');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatusBadge = ({ status }) => {
    const config = {
      'PENDING': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending Response' },
      'TARGET_ACCEPTED': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Awaiting Approval' },
      'TARGET_REJECTED': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Declined' },
      'ADMIN_APPROVED': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Approved' },
      'ADMIN_REJECTED': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Admin Rejected' },
      'CANCELLED': { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Cancelled' },
      'EXPIRED': { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Expired' }
    }[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status };
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaExchangeAlt className="text-2xl text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Room Swap Management</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 text-center">
          <p className="text-yellow-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending || 0}</p>
        </div>
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-center">
          <p className="text-blue-400 text-sm">Awaiting Approval</p>
          <p className="text-2xl font-bold text-blue-400">{stats.awaitingAdmin || 0}</p>
        </div>
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-center">
          <p className="text-green-400 text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-400">{stats.approved || 0}</p>
        </div>
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-center">
          <p className="text-red-400 text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-400">{stats.rejected || 0}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <FaFilter className="text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
        >
          <option value="TARGET_ACCEPTED">Awaiting Approval</option>
          <option value="PENDING">Pending Response</option>
          <option value="ADMIN_APPROVED">Approved</option>
          <option value="ADMIN_REJECTED">Rejected</option>
          <option value="ALL">All Requests</option>
        </select>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="lg:col-span-2 text-center py-12 text-gray-400">Loading...</div>
        ) : requests.length > 0 ? (
          requests.map((req) => (
            <div
              key={req._id}
              className={`bg-gray-800 rounded-xl p-5 border transition cursor-pointer ${
                selectedRequest?._id === req._id 
                  ? 'border-blue-500' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedRequest(selectedRequest?._id === req._id ? null : req)}
            >
              <div className="flex justify-between items-start mb-3">
                <StatusBadge status={req.status} />
                <span className="text-gray-500 text-xs">{formatDate(req.createdAt)}</span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 bg-gray-900 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">From</p>
                  <p className="font-bold text-white">{req.requesterId}</p>
                  <p className="text-yellow-400 text-sm">Room {req.requesterRoomNumber}</p>
                </div>
                <FaExchangeAlt className="text-blue-400" />
                <div className="flex-1 bg-gray-900 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">To</p>
                  <p className="font-bold text-white">{req.targetId}</p>
                  <p className="text-yellow-400 text-sm">Room {req.targetRoomNumber}</p>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-2">
                <span className="text-gray-500">Reason:</span> "{req.reason}"
              </p>

              {req.targetResponse?.message && (
                <p className="text-gray-400 text-xs italic">
                  Target response: "{req.targetResponse.message}"
                </p>
              )}

              {/* Action Panel */}
              {selectedRequest?._id === req._id && req.status === 'TARGET_ACCEPTED' && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Admin remarks (optional)..."
                    className="w-full p-2 bg-gray-900 rounded text-white text-sm border border-gray-700 mb-3"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDecision(req._id, true); }}
                      disabled={loading}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition"
                    >
                      <FaCheck className="inline mr-1" /> Approve Swap
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDecision(req._id, false); }}
                      disabled={loading}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition"
                    >
                      <FaTimes className="inline mr-1" /> Reject
                    </button>
                  </div>
                </div>
              )}

              {req.adminDecision?.remarks && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-500">
                    Admin: {req.adminDecision.remarks} 
                    <span className="ml-2">({formatDate(req.adminDecision.decidedAt)})</span>
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="lg:col-span-2 text-center py-12 text-gray-500">
            No swap requests found for this filter
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomSwapAdmin;

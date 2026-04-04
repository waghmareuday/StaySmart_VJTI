import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'OVERDUE', 'CANCELLED'];
const PASS_TYPE_OPTIONS = ['ALL', 'NIGHT_OUT', 'WEEKEND', 'VACATION', 'EMERGENCY'];

const STATUS_BADGES = {
  PENDING: 'bg-yellow-900/40 text-yellow-300',
  APPROVED: 'bg-green-900/40 text-green-300',
  REJECTED: 'bg-red-900/40 text-red-300',
  ACTIVE: 'bg-indigo-900/40 text-indigo-300',
  COMPLETED: 'bg-gray-700 text-gray-200',
  CANCELLED: 'bg-gray-800 text-gray-300',
  OVERDUE: 'bg-red-950 text-red-300'
};

export default function NightOutAdmin() {
  const [passes, setPasses] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'ALL', passType: 'ALL', date: '' });
  const [selectedPass, setSelectedPass] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, action: '', passId: null });
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPasses();
    fetchStats();
  }, [filters]);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.passType !== 'ALL') params.append('passType', filters.passType);
      if (filters.date) params.append('date', filters.date);

      const res = await apiFetch(`${API_ENDPOINTS.ADMIN_NIGHTOUT_PASSES}?${params}`);
      const data = await res.json();
      if (data.success) {
        setPasses(data.data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_NIGHTOUT_STATS);
      const data = await res.json();
      if (data.success) {
        setStats(data.data || {});
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const handleApproveReject = async (passId, approve) => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_NIGHTOUT_PROCESS(passId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approve,
          rejectionReason: approve ? '' : rejectionReason,
          remarks,
          adminId: 'admin'
        })
      });

      const data = await res.json();
      if (data.success) {
        setActionModal({ open: false, action: '', passId: null });
        setRemarks('');
        setRejectionReason('');
        fetchPasses();
        fetchStats();
      }
    } catch (err) {
      console.error('Process error:', err);
    }
  };

  const handleCheckOut = async (passId) => {
    if (!confirm('Mark student as checked out?')) return;

    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_NIGHTOUT_CHECKOUT(passId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (data.success) {
        fetchPasses();
        fetchStats();
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const handleCheckIn = async (passId) => {
    if (!confirm('Mark student as checked in?')) return;

    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_NIGHTOUT_CHECKIN(passId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guardName: 'Admin' })
      });

      const data = await res.json();
      if (data.success) {
        fetchPasses();
        fetchStats();
      }
    } catch (err) {
      console.error('Checkin error:', err);
    }
  };

  const handleMarkOverdue = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_NIGHTOUT_MARK_OVERDUE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (data.success) {
        alert(`Marked ${data.count} passes as overdue`);
        fetchPasses();
        fetchStats();
      }
    } catch (err) {
      console.error('Mark overdue error:', err);
    }
  };

  const getPassTypeIcon = (type) => {
    const icons = { NIGHT_OUT: '🌙', WEEKEND: '📅', VACATION: '✈️', EMERGENCY: '🚨' };
    return icons[type] || '🎫';
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-900 text-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-100">Night Out Pass Management</h1>
          <button
            onClick={handleMarkOverdue}
            className="px-4 py-2 bg-red-900/40 text-red-300 rounded-lg hover:bg-red-900/60 text-sm"
          >
            Mark Overdue Passes
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.totalPending || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-indigo-500">
            <p className="text-sm text-gray-400">Currently Out</p>
            <p className="text-2xl font-bold text-indigo-400">{stats.currentlyOut || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-red-500">
            <p className="text-sm text-gray-400">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-400">Today's Departures</p>
            <p className="text-2xl font-bold text-green-600">{stats.todayDepartures || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-violet-500">
            <p className="text-sm text-gray-400">Today's Returns</p>
            <p className="text-2xl font-bold text-purple-600">{stats.todayReturns || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 p-4 rounded-xl shadow-sm mb-6 border border-gray-700">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-200"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>
              ))}
            </select>
            <select
              value={filters.passType}
              onChange={(e) => setFilters(f => ({ ...f, passType: e.target.value }))}
              className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-200"
            >
              {PASS_TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t.replace('_', ' ')}</option>
              ))}
            </select>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
              className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-200"
            />
            {filters.date && (
              <button
                onClick={() => setFilters(f => ({ ...f, date: '' }))}
                className="px-3 py-2 text-gray-400 hover:text-gray-200"
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        {/* Passes Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : passes.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No passes found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Destination</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Departure</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Return</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {passes.map(pass => (
                    <tr key={pass._id} className="hover:bg-gray-700/40">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-100">{pass.studentName}</p>
                        <p className="text-xs text-gray-400">{pass.studentId} | Room {pass.roomNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          {getPassTypeIcon(pass.passType)}
                          <span className="text-sm">{pass.passType?.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-100">{pass.destination}</p>
                        <p className="text-xs text-gray-400">{pass.reason}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <p>{new Date(pass.departureDate).toLocaleDateString()}</p>
                        <p className="text-gray-400">{pass.departureTime}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <p>{new Date(pass.expectedReturnDate).toLocaleDateString()}</p>
                        <p className="text-gray-400">{pass.expectedReturnTime}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[pass.status]}`}>
                          {pass.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          {pass.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => setActionModal({ open: true, action: 'approve', passId: pass._id })}
                                className="px-2 py-1 bg-green-900/40 text-green-300 rounded text-xs hover:bg-green-900/60"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setActionModal({ open: true, action: 'reject', passId: pass._id })}
                                className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs hover:bg-red-900/60"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {pass.status === 'APPROVED' && (
                            <button
                              onClick={() => handleCheckOut(pass._id)}
                              className="px-2 py-1 bg-indigo-900/40 text-indigo-300 rounded text-xs hover:bg-indigo-900/60"
                            >
                              Check Out
                            </button>
                          )}
                          {['ACTIVE', 'OVERDUE'].includes(pass.status) && (
                            <button
                              onClick={() => handleCheckIn(pass._id)}
                              className="px-2 py-1 bg-violet-900/40 text-violet-300 rounded text-xs hover:bg-violet-900/60"
                            >
                              Check In
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPass(pass)}
                            className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-xs hover:bg-gray-600"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Modal (Approve/Reject) */}
        {actionModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md text-gray-100">
              <h3 className="text-xl font-bold mb-4">
                {actionModal.action === 'approve' ? 'Approve Pass' : 'Reject Pass'}
              </h3>

              {actionModal.action === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Rejection Reason *</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection"
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Remarks (Optional)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Any additional remarks"
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setActionModal({ open: false, action: '', passId: null });
                    setRemarks('');
                    setRejectionReason('');
                  }}
                  className="flex-1 py-2 border border-gray-600 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApproveReject(actionModal.passId, actionModal.action === 'approve')}
                  className={`flex-1 py-2 text-white rounded-lg ${
                    actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionModal.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {selectedPass && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[85vh] md:max-h-[90vh] overflow-y-auto text-gray-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Pass Details</h3>
                <button
                  onClick={() => setSelectedPass(null)}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Student</p>
                    <p className="font-medium">{selectedPass.studentName}</p>
                    <p className="text-sm text-gray-300">{selectedPass.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Room</p>
                    <p className="font-medium">{selectedPass.roomNumber}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Destination</p>
                  <p className="font-medium">{selectedPass.destination}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Reason</p>
                  <p className="font-medium">{selectedPass.reason}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Departure</p>
                    <p className="font-medium">{new Date(selectedPass.departureDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Expected Return</p>
                    <p className="font-medium">{new Date(selectedPass.expectedReturnDate).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Contact</p>
                    <p className="font-medium">{selectedPass.contactNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Parent Contact</p>
                    <p className="font-medium">{selectedPass.parentContact || 'N/A'}</p>
                  </div>
                </div>

                {selectedPass.emergencyContact?.name && (
                  <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                    <p className="text-sm text-gray-400">Emergency Contact</p>
                    <p className="font-medium">
                      {selectedPass.emergencyContact.name} ({selectedPass.emergencyContact.relation})
                    </p>
                    <p className="text-sm">{selectedPass.emergencyContact.phone}</p>
                  </div>
                )}

                {selectedPass.checkedOutAt && (
                  <div className="p-3 bg-indigo-900/30 border border-indigo-700 rounded-lg">
                    <p className="text-sm text-indigo-300">
                      <strong>Checked Out:</strong> {new Date(selectedPass.checkedOutAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedPass.checkedInAt && (
                  <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                    <p className="text-sm text-green-300">
                      <strong>Checked In:</strong> {new Date(selectedPass.checkedInAt).toLocaleString()}
                      {selectedPass.checkedInBy && ` by ${selectedPass.checkedInBy}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

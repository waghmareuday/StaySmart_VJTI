import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

const STATUS_OPTIONS = ['ALL', 'SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const CATEGORY_OPTIONS = ['ALL', 'ELECTRICAL', 'PLUMBING', 'FURNITURE', 'AC_COOLER', 'CLEANING', 'PEST_CONTROL', 'INTERNET', 'OTHER'];

const STATUS_BADGES = {
  SUBMITTED: 'bg-indigo-900/40 text-indigo-300',
  ACKNOWLEDGED: 'bg-violet-900/40 text-violet-300',
  IN_PROGRESS: 'bg-yellow-900/40 text-yellow-300',
  RESOLVED: 'bg-green-900/40 text-green-300',
  CLOSED: 'bg-gray-700 text-gray-300'
};

const URGENCY_BADGES = {
  LOW: 'bg-indigo-900/40 text-indigo-300',
  MEDIUM: 'bg-yellow-900/40 text-yellow-300',
  HIGH: 'bg-orange-900/40 text-orange-300',
  CRITICAL: 'bg-red-900/40 text-red-300'
};

export default function MaintenanceAdmin() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'ALL', category: 'ALL', urgency: 'ALL' });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', assignedTo: '', adminRemarks: '' });

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filters]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.category !== 'ALL') params.append('category', filters.category);
      if (filters.urgency !== 'ALL') params.append('urgency', filters.urgency);

      const res = await apiFetch(`${API_ENDPOINTS.ADMIN_MAINTENANCE_REQUESTS}?${params}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_MAINTENANCE_STATS);
      const data = await res.json();
      if (data.success) {
        setStats(data.data || {});
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const openUpdateModal = (request) => {
    setSelectedRequest(request);
    setUpdateForm({
      status: request.status,
      assignedTo: request.assignedTo || '',
      adminRemarks: request.adminRemarks || ''
    });
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;

    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_MAINTENANCE_UPDATE(selectedRequest._id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateForm)
      });

      const data = await res.json();
      if (data.success) {
        setSelectedRequest(null);
        fetchRequests();
        fetchStats();
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      ELECTRICAL: '⚡', PLUMBING: '🚿', FURNITURE: '🪑', AC_COOLER: '❄️',
      CLEANING: '🧹', PEST_CONTROL: '🐛', INTERNET: '📶', OTHER: '🔧'
    };
    return icons[cat] || '🔧';
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-900 text-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-100 mb-6">Maintenance Management</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-indigo-500">
            <p className="text-sm text-gray-400">New</p>
            <p className="text-2xl font-bold text-indigo-400">{stats.submitted || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-violet-500">
            <p className="text-sm text-gray-400">Acknowledged</p>
            <p className="text-2xl font-bold text-purple-600">{stats.acknowledged || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm text-gray-400">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-400">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-red-500">
            <p className="text-sm text-gray-400">Critical</p>
            <p className="text-2xl font-bold text-red-600">{stats.critical || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-200"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
              className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-200"
            >
              {CATEGORY_OPTIONS.map(c => (
                <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              value={filters.urgency}
              onChange={(e) => setFilters(f => ({ ...f, urgency: e.target.value }))}
              className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-200"
            >
              <option value="ALL">All Urgency</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Request</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Location</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Urgency</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {requests.map(req => (
                    <tr key={req._id} className="hover:bg-gray-700/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCategoryIcon(req.category)}</span>
                          <div>
                            <p className="font-medium text-gray-100">{req.title}</p>
                            <p className="text-xs text-gray-400">{req.category?.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{req.studentName}</p>
                        <p className="text-xs text-gray-400">{req.studentId}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{req.location}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${URGENCY_BADGES[req.urgency]}`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[req.status]}`}>
                          {req.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openUpdateModal(req)}
                          className="px-3 py-1 bg-indigo-900/40 text-indigo-300 rounded-lg hover:bg-indigo-900/60 text-sm"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Update Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg text-gray-100">
              <h3 className="text-xl font-bold mb-4">Update Request</h3>

              <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                <p className="font-medium">{selectedRequest.title}</p>
                <p className="text-sm text-gray-300">{selectedRequest.description}</p>
                <p className="text-sm text-gray-400 mt-2">
                  <strong>Student:</strong> {selectedRequest.studentName} | <strong>Location:</strong> {selectedRequest.location}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="ACKNOWLEDGED">Acknowledged</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Assigned To</label>
                  <input
                    type="text"
                    value={updateForm.assignedTo}
                    onChange={(e) => setUpdateForm(f => ({ ...f, assignedTo: e.target.value }))}
                    placeholder="Electrician name, Plumber, etc."
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Remarks for Student</label>
                  <textarea
                    value={updateForm.adminRemarks}
                    onChange={(e) => setUpdateForm(f => ({ ...f, adminRemarks: e.target.value }))}
                    rows={3}
                    placeholder="e.g., Technician will visit tomorrow"
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 py-2 border border-gray-600 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

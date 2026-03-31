import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'ACTIVE', 'OVERDUE', 'COMPLETED', 'REJECTED', 'CANCELLED'];

const STATUS_BADGES = {
  PENDING: 'bg-yellow-900/40 text-yellow-300',
  APPROVED: 'bg-green-900/40 text-green-300',
  REJECTED: 'bg-red-900/40 text-red-300',
  ACTIVE: 'bg-indigo-900/40 text-indigo-300',
  COMPLETED: 'bg-gray-700 text-gray-200',
  CANCELLED: 'bg-gray-800 text-gray-300',
  OVERDUE: 'bg-red-950 text-red-300'
};

const PASS_LABELS = {
  NIGHT_OUT: 'Night Out',
  WEEKEND: 'Weekend',
  VACATION: 'Vacation',
  EMERGENCY: 'Emergency'
};

function WardenNightOutManager() {
  const navigate = useNavigate();
  const [warden, setWarden] = useState(null);
  const [token, setToken] = useState('');
  const [passes, setPasses] = useState([]);
  const [stats, setStats] = useState(null);
  const [managedBlocks, setManagedBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [error, setError] = useState('');

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }), [token]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('wardenToken');

    if (!savedUser || !savedToken) {
      navigate('/Login', { state: { message: 'Please login as rector' } });
      return;
    }

    const parsed = JSON.parse(savedUser);
    if (!(parsed.isWarden || parsed.role === 'warden')) {
      navigate('/');
      return;
    }

    setWarden(parsed);
    setToken(savedToken);
  }, [navigate]);

  useEffect(() => {
    if (!token) return;
    fetchPassData();
  }, [token, filterStatus]);

  const fetchPassData = async () => {
    setLoading(true);
    setError('');

    try {
      const query = filterStatus !== 'ALL' ? `?status=${encodeURIComponent(filterStatus)}` : '';
      const [passesRes, statsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.WARDEN_NIGHTOUT_PASSES}${query}`, { headers: authHeaders }),
        fetch(API_ENDPOINTS.WARDEN_NIGHTOUT_STATS, { headers: authHeaders })
      ]);

      const passesData = await passesRes.json();
      const statsData = await statsRes.json();

      if (!passesRes.ok || !passesData.success) {
        throw new Error(passesData.message || 'Failed to fetch passes');
      }

      if (!statsRes.ok || !statsData.success) {
        throw new Error(statsData.message || 'Failed to fetch stats');
      }

      setPasses(passesData.data || []);
      setManagedBlocks(passesData.managedBlocks || statsData.managedBlocks || []);
      setStats(statsData.data || null);
    } catch (err) {
      setError(err.message || 'Unable to load pass data');
    } finally {
      setLoading(false);
    }
  };

  const processPass = async (passId, approve) => {
    const remarks = window.prompt(approve ? 'Optional approval note:' : 'Reason for rejection:') || '';
    if (!approve && !remarks.trim()) return;

    setProcessingId(passId);
    try {
      const response = await fetch(API_ENDPOINTS.WARDEN_NIGHTOUT_PROCESS(passId), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ approve, remarks, rejectionReason: approve ? '' : remarks })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to process pass');
      }

      await fetchPassData();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessingId('');
    }
  };

  const checkOutStudent = async (passId) => {
    setProcessingId(passId);
    try {
      const response = await fetch(API_ENDPOINTS.WARDEN_NIGHTOUT_CHECKOUT(passId), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to check out');
      }
      await fetchPassData();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessingId('');
    }
  };

  const checkInStudent = async (passId) => {
    setProcessingId(passId);
    try {
      const response = await fetch(API_ENDPOINTS.WARDEN_NIGHTOUT_CHECKIN(passId), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to check in');
      }
      await fetchPassData();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessingId('');
    }
  };

  if (!warden) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Checking warden session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6 pt-24 text-white">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-200">Night Out Pass Operations</h1>
          <p className="text-sm text-gray-400 mt-1">
            Logged in as {warden.name} • Managed blocks: {managedBlocks.join(', ') || 'N/A'}
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Pending" value={stats.totalPending} tone="yellow" />
            <StatCard label="Approved" value={stats.approved || 0} tone="green" />
            <StatCard label="Currently Out" value={stats.currentlyOut} tone="blue" />
            <StatCard label="Overdue" value={stats.overdue} tone="red" />
            <StatCard label="Today Departures" value={stats.todayDepartures} tone="slate" />
          </div>
        )}

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-600 bg-gray-900 text-gray-200 rounded-lg text-sm"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <button
              onClick={fetchPassData}
              className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-lg bg-red-900/30 border border-red-700 px-3 py-2 text-sm text-red-300">{error}</div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading passes...</div>
          ) : passes.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No pass requests in your managed blocks.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 text-gray-300">
                  <tr>
                    <th className="text-left px-3 py-2">Student</th>
                    <th className="text-left px-3 py-2">Block</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-left px-3 py-2">Dates</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {passes.map((pass) => (
                    <tr key={pass._id} className="border-t border-gray-700 align-top">
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-200">{pass.studentName}</p>
                        <p className="text-xs text-gray-400">{pass.studentId} • Room {pass.roomNumber}</p>
                      </td>
                      <td className="px-3 py-3 font-medium">{pass.hostelBlock || 'UNKNOWN'}</td>
                      <td className="px-3 py-3">{PASS_LABELS[pass.passType] || pass.passType}</td>
                      <td className="px-3 py-3">
                        <p>{new Date(pass.departureDate).toLocaleDateString()} → {new Date(pass.expectedReturnDate).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">{pass.destination}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[pass.status] || 'bg-gray-700 text-gray-300'}`}>
                          {pass.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          {pass.status === 'PENDING' && (
                            <>
                              <ActionButton
                                disabled={processingId === pass._id}
                                onClick={() => processPass(pass._id, true)}
                                tone="green"
                                label="Approve"
                              />
                              <ActionButton
                                disabled={processingId === pass._id}
                                onClick={() => processPass(pass._id, false)}
                                tone="red"
                                label="Reject"
                              />
                            </>
                          )}

                          {pass.status === 'APPROVED' && (
                            <ActionButton
                              disabled={processingId === pass._id}
                              onClick={() => checkOutStudent(pass._id)}
                              tone="blue"
                              label="Check Out"
                            />
                          )}

                          {(pass.status === 'ACTIVE' || pass.status === 'OVERDUE') && (
                            <ActionButton
                              disabled={processingId === pass._id}
                              onClick={() => checkInStudent(pass._id)}
                              tone="slate"
                              label="Check In"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ onClick, label, tone, disabled }) {
  const tones = {
    green: 'bg-green-900/40 text-green-300 hover:bg-green-900/60',
    red: 'bg-red-900/40 text-red-300 hover:bg-red-900/60',
    blue: 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60',
    slate: 'bg-gray-700 text-gray-200 hover:bg-gray-600'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1.5 rounded text-xs font-medium transition ${tones[tone]} disabled:opacity-50`}
    >
      {disabled ? '...' : label}
    </button>
  );
}

function StatCard({ label, value, tone }) {
  const toneMap = {
    yellow: 'border-yellow-700 text-yellow-300 bg-yellow-900/20',
    green: 'border-green-700 text-green-300 bg-green-900/20',
    blue: 'border-indigo-700 text-indigo-300 bg-indigo-900/20',
    red: 'border-red-700 text-red-300 bg-red-900/20',
    slate: 'border-gray-600 text-gray-300 bg-gray-800'
  };

  return (
    <div className={`border rounded-xl px-4 py-3 ${toneMap[tone]}`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value ?? 0}</p>
    </div>
  );
}

export default WardenNightOutManager;

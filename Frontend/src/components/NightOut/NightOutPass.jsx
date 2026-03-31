import { useState, useEffect } from 'react';
import myHook from '../Context';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

const PASS_TYPES = [
  { value: 'NIGHT_OUT', label: 'Night Out', desc: 'Single night stay outside', icon: '🌙' },
  { value: 'WEEKEND', label: 'Weekend', desc: 'Friday to Sunday', icon: '📅' },
  { value: 'VACATION', label: 'Vacation', desc: 'Extended leave', icon: '✈️' },
  { value: 'EMERGENCY', label: 'Emergency', desc: 'Urgent family matter', icon: '🚨' }
];

const STATUS_BADGES = {
  PENDING: 'bg-yellow-900/40 text-yellow-300',
  APPROVED: 'bg-green-900/40 text-green-300',
  REJECTED: 'bg-red-900/40 text-red-300',
  ACTIVE: 'bg-indigo-900/40 text-indigo-300',
  COMPLETED: 'bg-gray-700 text-gray-200',
  CANCELLED: 'bg-gray-800 text-gray-300',
  OVERDUE: 'bg-red-950 text-red-300'
};

export default function NightOutPass() {
  const { user } = myHook();
  const [activeTab, setActiveTab] = useState('apply');
  const [passes, setPasses] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [form, setForm] = useState({
    passType: 'NIGHT_OUT',
    reason: '',
    destination: '',
    contactNumber: '',
    parentContact: '',
    departureDate: '',
    departureTime: '18:00',
    expectedReturnDate: '',
    expectedReturnTime: '20:00',
    emergencyContact: { name: '', phone: '', relation: '' }
  });

  useEffect(() => {
    if (user?.studentId) {
      fetchMyPasses();
    }
  }, [user?.studentId]);

  const fetchMyPasses = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.NIGHTOUT_MY_PASSES(user.studentId));
      const data = await res.json();
      if (data.success) {
        setPasses(data.data || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emergency.')) {
      const field = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [field]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!form.reason || !form.destination || !form.departureDate || !form.expectedReturnDate) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    if (new Date(form.expectedReturnDate) < new Date(form.departureDate)) {
      setMessage({ type: 'error', text: 'Return date must be after departure date' });
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.NIGHTOUT_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.studentId,
          studentName: user.name,
          roomNumber: user.roomNumber || 'Unknown',
          ...form
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Pass request submitted! Awaiting approval.' });
        setForm({
          passType: 'NIGHT_OUT',
          reason: '',
          destination: '',
          contactNumber: '',
          parentContact: '',
          departureDate: '',
          departureTime: '18:00',
          expectedReturnDate: '',
          expectedReturnTime: '20:00',
          emergencyContact: { name: '', phone: '', relation: '' }
        });
        fetchMyPasses();
        setActiveTab('status');
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      console.error('Submit night-out request error:', err);
      setMessage({ type: 'error', text: 'Failed to submit request' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (passId) => {
    if (!confirm('Cancel this pass request?')) return;

    try {
      const res = await apiFetch(API_ENDPOINTS.NIGHTOUT_CANCEL(passId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.studentId })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Pass cancelled' });
        fetchMyPasses();
      }
    } catch (err) {
      console.error('Cancel night-out request error:', err);
      setMessage({ type: 'error', text: 'Failed to cancel' });
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Night Out Pass</h1>
          <p className="text-gray-400 mt-2">Request permission for overnight leave</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-700">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
            <p className="text-sm text-gray-400">Pending</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-700">
            <p className="text-2xl font-bold text-green-600">{stats.approved || 0}</p>
            <p className="text-sm text-gray-400">Approved</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-700">
            <p className="text-2xl font-bold text-indigo-400">{stats.active || 0}</p>
            <p className="text-sm text-gray-400">Active</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'apply' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            📝 Apply for Pass
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'status' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            📋 My Passes ({passes.length})
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Apply Form */}
        {activeTab === 'apply' && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pass Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">Pass Type *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PASS_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, passType: type.value }))}
                      className={`p-4 rounded-xl border-2 transition text-center ${
                        form.passType === type.value
                          ? 'border-indigo-500 bg-indigo-900/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <p className="mt-1 font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-gray-400">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination & Reason */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Destination *</label>
                  <input
                    type="text"
                    name="destination"
                    value={form.destination}
                    onChange={handleChange}
                    placeholder="e.g., Home - Pune, Friend's place"
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Reason *</label>
                  <input
                    type="text"
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    placeholder="e.g., Family function, Medical appointment"
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Departure Date *</label>
                  <input
                    type="date"
                    name="departureDate"
                    value={form.departureDate}
                    onChange={handleChange}
                    min={getMinDate()}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Departure Time</label>
                  <input
                    type="time"
                    name="departureTime"
                    value={form.departureTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Expected Return Date *</label>
                  <input
                    type="date"
                    name="expectedReturnDate"
                    value={form.expectedReturnDate}
                    onChange={handleChange}
                    min={form.departureDate || getMinDate()}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Expected Return Time</label>
                  <input
                    type="time"
                    name="expectedReturnTime"
                    value={form.expectedReturnTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Contact Numbers */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Your Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={handleChange}
                    placeholder="Your mobile number"
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Parent Contact Number</label>
                  <input
                    type="tel"
                    name="parentContact"
                    value={form.parentContact}
                    onChange={handleChange}
                    placeholder="Parent's mobile number"
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                <label className="block text-sm font-medium text-gray-200 mb-3">Emergency Contact (Optional)</label>
                <div className="grid md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    name="emergency.name"
                    value={form.emergencyContact.name}
                    onChange={handleChange}
                    placeholder="Name"
                    className="px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                  <input
                    type="tel"
                    name="emergency.phone"
                    value={form.emergencyContact.phone}
                    onChange={handleChange}
                    placeholder="Phone"
                    className="px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                  <input
                    type="text"
                    name="emergency.relation"
                    value={form.emergencyContact.relation}
                    onChange={handleChange}
                    placeholder="Relation"
                    className="px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-500 transition"
              >
                {loading ? 'Submitting...' : 'Submit Pass Request'}
              </button>
            </form>
          </div>
        )}

        {/* Pass History */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : passes.length === 0 ? (
              <div className="bg-gray-800 rounded-2xl p-12 text-center">
                <p className="text-5xl mb-4">🌙</p>
                <p className="text-gray-400">No pass requests yet</p>
              </div>
            ) : (
              passes.map(pass => (
                <div key={pass._id} className="bg-gray-800 border border-gray-700 rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{PASS_TYPES.find(t => t.value === pass.passType)?.icon || '🎫'}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{pass.destination}</h3>
                        <p className="text-sm text-gray-400">{pass.reason}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_BADGES[pass.status]}`}>
                      {pass.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-400">Departure</p>
                      <p className="font-medium">{new Date(pass.departureDate).toLocaleDateString()}</p>
                      <p className="text-gray-300">{pass.departureTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Expected Return</p>
                      <p className="font-medium">{new Date(pass.expectedReturnDate).toLocaleDateString()}</p>
                      <p className="text-gray-300">{pass.expectedReturnTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Pass Type</p>
                      <p className="font-medium">{pass.passType?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Applied On</p>
                      <p className="font-medium">{new Date(pass.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {pass.rejectionReason && (
                    <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg mb-4">
                      <p className="text-sm text-red-300"><strong>Reason:</strong> {pass.rejectionReason}</p>
                    </div>
                  )}

                  {pass.remarks && (
                    <div className="p-3 bg-indigo-900/30 border border-indigo-700 rounded-lg mb-4">
                      <p className="text-sm text-indigo-300"><strong>Remarks:</strong> {pass.remarks}</p>
                    </div>
                  )}

                  {['PENDING', 'APPROVED'].includes(pass.status) && (
                    <button
                      onClick={() => handleCancel(pass._id)}
                      className="px-4 py-2 text-red-300 border border-red-700 rounded-lg hover:bg-red-900/30 text-sm"
                    >
                      Cancel Pass
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

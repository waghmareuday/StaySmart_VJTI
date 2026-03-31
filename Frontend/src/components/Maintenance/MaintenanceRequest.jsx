import { useState, useEffect } from 'react';
import myHook from '../Context';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

const CATEGORIES = [
  { value: 'ELECTRICAL', label: 'Electrical', icon: '⚡' },
  { value: 'PLUMBING', label: 'Plumbing', icon: '🚿' },
  { value: 'FURNITURE', label: 'Furniture', icon: '🪑' },
  { value: 'AC_COOLER', label: 'AC / Cooler', icon: '❄️' },
  { value: 'CLEANING', label: 'Cleaning', icon: '🧹' },
  { value: 'PEST_CONTROL', label: 'Pest Control', icon: '🐛' },
  { value: 'INTERNET', label: 'Internet / WiFi', icon: '📶' },
  { value: 'OTHER', label: 'Other', icon: '🔧' }
];

const URGENCY_LEVELS = [
  { value: 'LOW', label: 'Low', color: 'bg-indigo-900/40 text-indigo-300', desc: 'Can wait a few days' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-900/40 text-yellow-300', desc: 'Within 2 days' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-900/40 text-orange-300', desc: 'Same day' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-900/40 text-red-300', desc: 'Emergency!' }
];

const STATUS_BADGES = {
  SUBMITTED: 'bg-indigo-900/40 text-indigo-300',
  ACKNOWLEDGED: 'bg-violet-900/40 text-violet-300',
  IN_PROGRESS: 'bg-yellow-900/40 text-yellow-300',
  RESOLVED: 'bg-green-900/40 text-green-300',
  CLOSED: 'bg-gray-700 text-gray-300'
};

export default function MaintenanceRequest() {
  const { user } = myHook();
  const [activeTab, setActiveTab] = useState('new');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    urgency: 'MEDIUM'
  });

  // Rating state for closing resolved requests
  const [ratingModal, setRatingModal] = useState({ open: false, requestId: null, rating: 5, feedback: '' });

  useEffect(() => {
    if (user?.studentId) {
      fetchMyRequests();
    }
  }, [user?.studentId]);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.MAINTENANCE_MY_REQUESTS(user.studentId));
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!form.category || !form.title || !form.description || !form.location) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.MAINTENANCE_CREATE, {
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
        setMessage({ type: 'success', text: 'Maintenance request submitted!' });
        setForm({ category: '', title: '', description: '', location: '', urgency: 'MEDIUM' });
        fetchMyRequests();
        setActiveTab('history');
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      console.error('Submit maintenance request error:', err);
      setMessage({ type: 'error', text: 'Failed to submit request' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRequest = async () => {
    if (!ratingModal.requestId) return;

    try {
      const res = await apiFetch(API_ENDPOINTS.MAINTENANCE_CLOSE(ratingModal.requestId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.studentId,
          rating: ratingModal.rating,
          feedback: ratingModal.feedback
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Thank you for your feedback!' });
        setRatingModal({ open: false, requestId: null, rating: 5, feedback: '' });
        fetchMyRequests();
      }
    } catch (err) {
      console.error('Close maintenance request error:', err);
      setMessage({ type: 'error', text: 'Failed to close request' });
    }
  };

  const getCategoryIcon = (cat) => {
    const found = CATEGORIES.find(c => c.value === cat);
    return found ? found.icon : '🔧';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Maintenance Requests</h1>
          <p className="text-gray-400 mt-2">Report issues with your room or hostel facilities</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'new' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            ➕ New Request
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'history' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            📋 My Requests ({requests.length})
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

        {/* New Request Form */}
        {activeTab === 'new' && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">Issue Category *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, category: cat.value }))}
                      className={`p-4 rounded-xl border-2 transition text-center ${
                        form.category === cat.value
                          ? 'border-indigo-500 bg-indigo-900/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <p className="mt-1 text-sm font-medium">{cat.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Issue Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g., Fan not working, Water leakage"
                  className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g., Room 205, Common Bathroom - 2nd Floor"
                  className="w-full px-4 py-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">Urgency Level</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {URGENCY_LEVELS.map(level => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, urgency: level.value }))}
                      className={`p-3 rounded-lg border-2 transition ${
                        form.urgency === level.value
                          ? `border-indigo-500 ${level.color}`
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <p className="font-medium">{level.label}</p>
                      <p className="text-xs opacity-75">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-500 transition"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {/* Request History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-gray-800 rounded-2xl p-12 text-center">
                <p className="text-5xl mb-4">🔧</p>
                <p className="text-gray-400">No maintenance requests yet</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req._id} className="bg-gray-800 border border-gray-700 rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getCategoryIcon(req.category)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{req.title}</h3>
                        <p className="text-sm text-gray-400">{req.location}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_BADGES[req.status]}`}>
                      {req.status?.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-4">{req.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        URGENCY_LEVELS.find(u => u.value === req.urgency)?.color || 'bg-gray-700'
                      }`}>
                        {req.urgency}
                      </span>
                      <span className="text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {req.status === 'RESOLVED' && (
                      <button
                        onClick={() => setRatingModal({ open: true, requestId: req._id, rating: 5, feedback: '' })}
                        className="px-4 py-2 bg-green-900/30 text-green-300 rounded-lg hover:bg-green-900/50 transition text-sm font-medium"
                      >
                        Rate & Close
                      </button>
                    )}
                  </div>

                  {req.adminRemarks && (
                    <div className="mt-4 p-3 bg-indigo-900/20 rounded-lg border border-indigo-700/40">
                      <p className="text-sm text-indigo-300"><strong>Admin:</strong> {req.adminRemarks}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Rating Modal */}
        {ratingModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md text-gray-100">
              <h3 className="text-xl font-bold mb-4">Rate the Service</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingModal(prev => ({ ...prev, rating: star }))}
                      className={`text-3xl ${ratingModal.rating >= star ? 'text-yellow-400' : 'text-gray-600'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Feedback (optional)</label>
                <textarea
                  value={ratingModal.feedback}
                  onChange={(e) => setRatingModal(prev => ({ ...prev, feedback: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  placeholder="How was the service?"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRatingModal({ open: false, requestId: null, rating: 5, feedback: '' })}
                  className="flex-1 py-2 border border-gray-600 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseRequest}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

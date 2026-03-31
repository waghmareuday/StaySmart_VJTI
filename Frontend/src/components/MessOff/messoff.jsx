import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import myHook from '../Context';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

export default function MessOffForm() {
  const { user } = myHook();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!startDate || !endDate) {
      setMessage({ type: 'error', text: 'Please select both start and end dates.' });
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setMessage({ type: 'error', text: 'End date must be on or after start date.' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch(API_ENDPOINTS.MESS_OFF, {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage({ type: 'error', text: data.message || 'Failed to submit mess off request.' });
      } else {
        setMessage({ type: 'success', text: data.message || 'Mess off request submitted.' });
        setStartDate('');
        setEndDate('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit mess off request.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
        <p>Please login to apply for mess off.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pt-28">
      <div className="w-full max-w-lg mx-auto p-6 shadow-lg rounded-2xl bg-gray-800 border border-gray-700">
        <h2 className="text-2xl font-semibold text-center text-slate-300 mb-4">Mess Off Request</h2>

        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-red-900/30 text-red-300 border border-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={user.name || ''}
            disabled
            className="w-full p-2 bg-gray-900 text-white rounded-lg border border-gray-700"
          />

          <input
            type="text"
            value={user.email || ''}
            disabled
            className="w-full p-2 bg-gray-900 text-white rounded-lg border border-gray-700"
          />

          <div>
            <label className="block text-sm text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full p-2 bg-gray-900 text-white rounded-lg border border-gray-700"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full p-2 bg-gray-900 text-white rounded-lg border border-gray-700"
              min={startDate || new Date().toISOString().split('T')[0]}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/MessBill')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg"
          >
            Go To Mess Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

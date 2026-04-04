import { useState, useEffect } from 'react';
import myHook from '../Context';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

const DUE_TYPES = {
  HOSTEL_FEE: { label: 'Hostel Fee', icon: '🏠', color: 'bg-indigo-900/40 text-indigo-300' },
  MESS_BILL: { label: 'Mess Bill', icon: '🍽️', color: 'bg-orange-900/40 text-orange-300' },
  FINE: { label: 'Fine', icon: '⚠️', color: 'bg-red-900/40 text-red-300' },
  ELECTRICITY: { label: 'Electricity', icon: '⚡', color: 'bg-yellow-900/40 text-yellow-300' },
  MAINTENANCE: { label: 'Maintenance', icon: '🔧', color: 'bg-violet-900/40 text-violet-300' },
  SECURITY_DEPOSIT: { label: 'Security Deposit', icon: '🔒', color: 'bg-green-900/40 text-green-300' },
  OTHER: { label: 'Other', icon: '📋', color: 'bg-gray-700 text-gray-200' }
};

const STATUS_BADGES = {
  PENDING: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
  PAID: 'bg-green-900/30 text-green-300 border-green-700',
  OVERDUE: 'bg-red-900/30 text-red-300 border-red-700',
  PARTIALLY_PAID: 'bg-indigo-900/30 text-indigo-300 border-indigo-700',
  WAIVED: 'bg-gray-700 text-gray-200 border-gray-600',
  CANCELLED: 'bg-gray-800 text-gray-300 border-gray-600'
};

export default function DuesPayment() {
  const { user } = myHook();
  const [activeTab, setActiveTab] = useState('pending');
  const [dues, setDues] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Payment modal
  const [paymentModal, setPaymentModal] = useState({ open: false, due: null });
  const [paymentForm, setPaymentForm] = useState({ amount: '', transactionId: '', paymentMethod: 'UPI' });

  useEffect(() => {
    if (user?.studentId) {
      fetchMyDues();
    }
  }, [user?.studentId]);

  const fetchMyDues = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.DUES_MY(user.studentId));
      const data = await res.json();
      if (data.success) {
        setDues(data.data || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDues = dues.filter(due => {
    if (activeTab === 'pending') return ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'].includes(due.status);
    if (activeTab === 'paid') return due.status === 'PAID';
    return true;
  });

  const openPaymentModal = (due) => {
    setPaymentModal({ open: true, due });
    setPaymentForm({ amount: due.remainingAmount, transactionId: '', paymentMethod: 'UPI' });
  };

  const handlePayment = async () => {
    if (!paymentModal.due) return;
    
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    try {
      const res = await apiFetch(API_ENDPOINTS.DUES_PAY(paymentModal.due._id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Payment recorded! Awaiting confirmation.' });
        setPaymentModal({ open: false, due: null });
        fetchMyDues();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      console.error('Payment error:', err);
      setMessage({ type: 'error', text: 'Payment failed' });
    }
  };

  const isOverdue = (due) => {
    return due.status === 'PENDING' && new Date() > new Date(due.dueDate);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">My Dues & Payments</h1>
          <p className="text-gray-400 mt-2">Track and pay your hostel fees, mess bills & more</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-red-500">
            <p className="text-sm text-gray-400">Total Pending</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalPending || 0)}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-400">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid || 0)}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-orange-500">
            <p className="text-sm text-gray-400">Overdue</p>
            <p className="text-2xl font-bold text-orange-600">{summary.overdueCount || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 border-indigo-500">
            <p className="text-sm text-gray-400">Total Dues</p>
            <p className="text-2xl font-bold text-blue-600">{summary.totalDues || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'pending' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            💳 Pending Dues
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'paid' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            ✅ Payment History
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

        {/* Dues List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : filteredDues.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl p-12 text-center">
              <p className="text-5xl mb-4">{activeTab === 'pending' ? '🎉' : '📋'}</p>
              <p className="text-gray-400">
                {activeTab === 'pending' ? 'No pending dues! You\'re all clear.' : 'No payment history yet.'}
              </p>
            </div>
          ) : (
            filteredDues.map(due => (
              <div 
                key={due._id} 
                className={`bg-gray-800 rounded-xl shadow-md p-6 border-l-4 ${
                  isOverdue(due) ? 'border-red-500' : 
                  due.status === 'PAID' ? 'border-green-500' : 'border-yellow-500'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{DUE_TYPES[due.dueType]?.icon || '📋'}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{due.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${DUE_TYPES[due.dueType]?.color}`}>
                        {DUE_TYPES[due.dueType]?.label || due.dueType}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-100">{formatCurrency(due.amount)}</p>
                    {due.lateFee > 0 && (
                      <p className="text-sm text-red-400">+{formatCurrency(due.lateFee)} late fee</p>
                    )}
                  </div>
                </div>

                {due.description && (
                  <p className="text-gray-400 text-sm mb-4">{due.description}</p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className={`px-3 py-1 rounded-full border ${STATUS_BADGES[due.status]}`}>
                      {due.status === 'PENDING' && isOverdue(due) ? 'OVERDUE' : due.status?.replace('_', ' ')}
                    </span>
                    <span className="text-gray-400">
                      Due: {new Date(due.dueDate).toLocaleDateString()}
                    </span>
                    {due.paidAmount > 0 && due.status !== 'PAID' && (
                      <span className="text-green-400">
                        Paid: {formatCurrency(due.paidAmount)}
                      </span>
                    )}
                  </div>

                  {['PENDING', 'OVERDUE', 'PARTIALLY_PAID'].includes(due.status) && (
                    <button
                      onClick={() => openPaymentModal(due)}
                      className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      Pay {formatCurrency(due.remainingAmount)}
                    </button>
                  )}
                </div>

                {due.paymentHistory && due.paymentHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm font-medium text-gray-300 mb-2">Payment History:</p>
                    <div className="space-y-2">
                      {due.paymentHistory.map((payment, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-gray-700 p-2 rounded text-gray-200">
                          <span>{formatCurrency(payment.amount)} via {payment.paymentMethod}</span>
                          <span className="text-gray-400">{new Date(payment.paidAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Payment Modal */}
        {paymentModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md text-gray-100">
              <h3 className="text-xl font-bold mb-4">Record Payment</h3>
              
              <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                <p className="font-medium">{paymentModal.due?.title}</p>
                <p className="text-sm text-gray-300">
                  Total Due: {formatCurrency(paymentModal.due?.remainingAmount || 0)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    max={paymentModal.due?.remainingAmount}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Transaction ID (if online)</label>
                  <input
                    type="text"
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm(f => ({ ...f, transactionId: e.target.value }))}
                    placeholder="Enter UPI/Transaction reference"
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setPaymentModal({ open: false, due: null })}
                  className="flex-1 py-2 border border-gray-600 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Submit Payment
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Payment will be verified by admin before updating status
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

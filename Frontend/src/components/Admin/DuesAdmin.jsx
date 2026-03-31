import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

const DUE_TYPES = ['HOSTEL_FEE', 'MESS_BILL', 'FINE', 'ELECTRICITY', 'MAINTENANCE', 'SECURITY_DEPOSIT', 'OTHER'];
const STATUS_OPTIONS = ['ALL', 'PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID', 'WAIVED'];

const STATUS_BADGES = {
  PENDING: 'bg-yellow-900/40 text-yellow-300',
  PAID: 'bg-green-900/40 text-green-300',
  OVERDUE: 'bg-red-900/40 text-red-300',
  PARTIALLY_PAID: 'bg-indigo-900/40 text-indigo-300',
  WAIVED: 'bg-gray-700 text-gray-200',
  CANCELLED: 'bg-gray-800 text-gray-300'
};

const TYPE_COLORS = {
  HOSTEL_FEE: 'bg-indigo-900/40 text-indigo-300',
  MESS_BILL: 'bg-orange-900/40 text-orange-300',
  FINE: 'bg-red-900/40 text-red-300',
  ELECTRICITY: 'bg-yellow-900/40 text-yellow-300',
  MAINTENANCE: 'bg-violet-900/40 text-violet-300',
  SECURITY_DEPOSIT: 'bg-green-900/40 text-green-300',
  OTHER: 'bg-gray-700 text-gray-200'
};

export default function DuesAdmin() {
  const [dues, setDues] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'ALL', dueType: 'ALL', studentId: '', overdue: false });
  
  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ open: false, due: null });
  const [actionModal, setActionModal] = useState({ open: false, action: '', due: null });
  
  // Forms
  const [createForm, setCreateForm] = useState({
    studentId: '', studentName: '', roomNumber: '', dueType: 'HOSTEL_FEE',
    title: '', description: '', amount: '', dueDate: ''
  });
  const [paymentForm, setPaymentForm] = useState({ amount: '', transactionId: '', paymentMethod: 'CASH', receivedBy: '', remarks: '' });
  const [lateFee, setLateFee] = useState(0);
  const [waiverReason, setWaiverReason] = useState('');

  useEffect(() => {
    fetchDues();
    fetchStats();
  }, [filters]);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.dueType !== 'ALL') params.append('dueType', filters.dueType);
      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.overdue) params.append('overdue', 'true');

      const res = await apiFetch(`${API_ENDPOINTS.ADMIN_DUES}?${params}`);
      const data = await res.json();
      if (data.success) {
        setDues(data.data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_DUES_STATS);
      const data = await res.json();
      if (data.success) {
        setStats(data.data || {});
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const handleCreateDue = async () => {
    if (!createForm.studentId || !createForm.title || !createForm.amount || !createForm.dueDate) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_DUES_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });

      const data = await res.json();
      if (data.success) {
        setCreateModal(false);
        setCreateForm({ studentId: '', studentName: '', roomNumber: '', dueType: 'HOSTEL_FEE', title: '', description: '', amount: '', dueDate: '' });
        fetchDues();
        fetchStats();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to create due');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentModal.due || !paymentForm.amount) return;

    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_DUES_PAYMENT(paymentModal.due._id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      });

      const data = await res.json();
      if (data.success) {
        setPaymentModal({ open: false, due: null });
        setPaymentForm({ amount: '', transactionId: '', paymentMethod: 'CASH', receivedBy: '', remarks: '' });
        fetchDues();
        fetchStats();
      }
    } catch (err) {
      alert('Failed to record payment');
    }
  };

  const handleApplyLateFee = async () => {
    if (!actionModal.due) return;

    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_DUES_LATE_FEE(actionModal.due._id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lateFee })
      });

      const data = await res.json();
      if (data.success) {
        setActionModal({ open: false, action: '', due: null });
        setLateFee(0);
        fetchDues();
      }
    } catch (err) {
      alert('Failed to apply late fee');
    }
  };

  const handleWaive = async () => {
    if (!actionModal.due) return;

    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_DUES_WAIVE(actionModal.due._id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waiverReason, waivedBy: 'Admin' })
      });

      const data = await res.json();
      if (data.success) {
        setActionModal({ open: false, action: '', due: null });
        setWaiverReason('');
        fetchDues();
        fetchStats();
      }
    } catch (err) {
      alert('Failed to waive due');
    }
  };

  const handleSendReminder = async (dueId) => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_DUES_REMINDER(dueId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (data.success) {
        alert('Reminder sent!');
        fetchDues();
      }
    } catch (err) {
      alert('Failed to send reminder');
    }
  };

  const handleMarkOverdue = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_DUES_MARK_OVERDUE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (data.success) {
        alert(`Marked ${data.count} dues as overdue`);
        fetchDues();
        fetchStats();
      }
    } catch (err) {
      alert('Failed');
    }
  };

  const handleDelete = async (dueId) => {
    if (!confirm('Delete this due? This cannot be undone.')) return;

    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_DUES_DELETE(dueId), {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        fetchDues();
        fetchStats();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-100">Dues & Payment Management</h1>
          <div className="flex gap-3">
            <button
              onClick={handleMarkOverdue}
              className="px-4 py-2 bg-red-900/40 text-red-300 rounded-lg hover:bg-red-900/60 text-sm"
            >
              Mark Overdue
            </button>
            <button
              onClick={() => setCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              + Create Due
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.totalPending || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-red-500">
            <p className="text-sm text-gray-400">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.totalOverdue || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-indigo-500">
            <p className="text-sm text-gray-400">Partially Paid</p>
            <p className="text-2xl font-bold text-indigo-400">{stats.partiallyPaid || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-400">Paid</p>
            <p className="text-2xl font-bold text-green-600">{stats.totalPaid || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-orange-500">
            <p className="text-sm text-gray-400">Pending Amount</p>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.pendingAmount)}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-indigo-500">
            <p className="text-sm text-gray-400">Collected</p>
            <p className="text-lg font-bold text-indigo-400">{formatCurrency(stats.collectedAmount)}</p>
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
              value={filters.dueType}
              onChange={(e) => setFilters(f => ({ ...f, dueType: e.target.value }))}
              className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-200"
            >
              <option value="ALL">All Types</option>
              {DUE_TYPES.map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search by Student ID"
              value={filters.studentId}
              onChange={(e) => setFilters(f => ({ ...f, studentId: e.target.value }))}
              className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-200"
            />
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={filters.overdue}
                onChange={(e) => setFilters(f => ({ ...f, overdue: e.target.checked }))}
              />
              <span className="text-sm">Overdue Only</span>
            </label>
          </div>
        </div>

        {/* Dues Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : dues.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No dues found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Due Details</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Amount</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Due Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {dues.map(due => (
                    <tr key={due._id} className="hover:bg-gray-700/40">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-100">{due.studentName}</p>
                        <p className="text-xs text-gray-400">{due.studentId} | Room {due.roomNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{due.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${TYPE_COLORS[due.dueType]}`}>
                          {due.dueType?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-bold">{formatCurrency(due.amount)}</p>
                        {due.lateFee > 0 && <p className="text-xs text-red-400">+{formatCurrency(due.lateFee)}</p>}
                        {due.paidAmount > 0 && due.status !== 'PAID' && (
                          <p className="text-xs text-green-400">Paid: {formatCurrency(due.paidAmount)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {new Date(due.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[due.status]}`}>
                          {due.status?.replace('_', ' ')}
                        </span>
                        {due.remindersSent > 0 && (
                          <p className="text-xs text-gray-400 mt-1">{due.remindersSent} reminders</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1 flex-wrap">
                          {['PENDING', 'OVERDUE', 'PARTIALLY_PAID'].includes(due.status) && (
                            <>
                              <button
                                onClick={() => { setPaymentModal({ open: true, due }); setPaymentForm(f => ({ ...f, amount: due.remainingAmount })); }}
                                className="px-2 py-1 bg-green-900/40 text-green-300 rounded text-xs hover:bg-green-900/60"
                              >
                                Payment
                              </button>
                              <button
                                onClick={() => handleSendReminder(due._id)}
                                className="px-2 py-1 bg-indigo-900/40 text-indigo-300 rounded text-xs hover:bg-indigo-900/60"
                              >
                                Remind
                              </button>
                              <button
                                onClick={() => { setActionModal({ open: true, action: 'lateFee', due }); }}
                                className="px-2 py-1 bg-orange-900/40 text-orange-300 rounded text-xs hover:bg-orange-900/60"
                              >
                                Late Fee
                              </button>
                              <button
                                onClick={() => { setActionModal({ open: true, action: 'waive', due }); }}
                                className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-xs hover:bg-gray-600"
                              >
                                Waive
                              </button>
                            </>
                          )}
                          {due.paidAmount === 0 && (
                            <button
                              onClick={() => handleDelete(due._id)}
                              className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs hover:bg-red-900/60"
                            >
                              Delete
                            </button>
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

        {/* Create Due Modal */}
        {createModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto text-gray-100">
              <h3 className="text-xl font-bold mb-4">Create New Due</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Student ID *</label>
                    <input
                      type="text"
                      value={createForm.studentId}
                      onChange={(e) => setCreateForm(f => ({ ...f, studentId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Student Name</label>
                    <input
                      type="text"
                      value={createForm.studentName}
                      onChange={(e) => setCreateForm(f => ({ ...f, studentName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Room Number</label>
                    <input
                      type="text"
                      value={createForm.roomNumber}
                      onChange={(e) => setCreateForm(f => ({ ...f, roomNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Type *</label>
                    <select
                      value={createForm.dueType}
                      onChange={(e) => setCreateForm(f => ({ ...f, dueType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                    >
                      {DUE_TYPES.map(t => (
                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g., Hostel Fee - Semester 1"
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      value={createForm.amount}
                      onChange={(e) => setCreateForm(f => ({ ...f, amount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date *</label>
                    <input
                      type="date"
                      value={createForm.dueDate}
                      onChange={(e) => setCreateForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setCreateModal(false)}
                  className="flex-1 py-2 border border-gray-600 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDue}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create Due
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md text-gray-100">
              <h3 className="text-xl font-bold mb-4">Record Payment</h3>
              
              <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                <p className="font-medium">{paymentModal.due?.title}</p>
                <p className="text-sm text-gray-300">{paymentModal.due?.studentName}</p>
                <p className="text-sm">Remaining: {formatCurrency(paymentModal.due?.remainingAmount)}</p>
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
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Transaction ID</label>
                  <input
                    type="text"
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm(f => ({ ...f, transactionId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Received By</label>
                  <input
                    type="text"
                    value={paymentForm.receivedBy}
                    onChange={(e) => setPaymentForm(f => ({ ...f, receivedBy: e.target.value }))}
                    placeholder="Accountant name"
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
                  onClick={handleRecordPayment}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Modal (Late Fee / Waive) */}
        {actionModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md text-gray-100">
              <h3 className="text-xl font-bold mb-4">
                {actionModal.action === 'lateFee' ? 'Apply Late Fee' : 'Waive Due'}
              </h3>

              <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                <p className="font-medium">{actionModal.due?.title}</p>
                <p className="text-sm">{actionModal.due?.studentName} - {formatCurrency(actionModal.due?.remainingAmount)}</p>
              </div>

              {actionModal.action === 'lateFee' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Late Fee Amount (₹)</label>
                  <input
                    type="number"
                    value={lateFee}
                    onChange={(e) => setLateFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">Waiver Reason</label>
                  <textarea
                    value={waiverReason}
                    onChange={(e) => setWaiverReason(e.target.value)}
                    rows={3}
                    placeholder="Reason for waiving this due"
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-gray-100 rounded-lg"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setActionModal({ open: false, action: '', due: null })}
                  className="flex-1 py-2 border border-gray-600 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={actionModal.action === 'lateFee' ? handleApplyLateFee : handleWaive}
                  className={`flex-1 py-2 text-white rounded-lg ${
                    actionModal.action === 'lateFee' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {actionModal.action === 'lateFee' ? 'Apply Late Fee' : 'Waive Due'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

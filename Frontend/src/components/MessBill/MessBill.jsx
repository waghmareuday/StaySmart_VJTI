import { useEffect, useMemo, useState } from 'react';
import myHook from '../Context';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

function MessBill() {
    const { user } = myHook();
    const [loadingBill, setLoadingBill] = useState(true);
    const [bill, setBill] = useState(null);
    const [billHistory, setBillHistory] = useState([]);
    const [utrNumber, setUtrNumber] = useState('');
    const [submittingUtr, setSubmittingUtr] = useState(false);
    const [messOffForm, setMessOffForm] = useState({ startDate: '', endDate: '' });
    const [submittingMessOff, setSubmittingMessOff] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const monthLabel = useMemo(() => {
        if (!bill?.month || !bill?.year) return '';
        const date = new Date(bill.year, bill.month - 1, 1);
        return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    }, [bill]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(amount || 0));
    };

    const fetchCurrentBill = async () => {
        setLoadingBill(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await apiFetch(API_ENDPOINTS.MESS_CURRENT_BILL);
            const data = await response.json();

            if (!response.ok || !data.success) {
                setMessage({ type: 'error', text: data.message || 'Unable to fetch current mess bill.' });
                setBill(null);
                setBillHistory([]);
            } else {
                const activeBill = data.activeBill || null;
                const latestBill = data.latestBill || data.data || null;
                const resolvedBill = activeBill || latestBill || null;
                const recentBills = Array.isArray(data.recentBills) ? data.recentBills : [];

                setBill(resolvedBill);
                setBillHistory(recentBills);

                if (!resolvedBill) {
                    setMessage({ type: 'info', text: 'No mess bill has been generated for your account yet.' });
                } else if (!activeBill) {
                    setMessage({ type: 'info', text: 'No pending bill right now. Showing your latest generated bill.' });
                }
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to fetch current mess bill.' });
            setBill(null);
            setBillHistory([]);
        } finally {
            setLoadingBill(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCurrentBill();
        } else {
            setLoadingBill(false);
        }
    }, [user]);

    const submitUtr = async (e) => {
        e.preventDefault();
        if (!bill?._id) {
            setMessage({ type: 'error', text: 'No active bill available for UTR submission.' });
            return;
        }
        if (bill.status !== 'PENDING') {
            setMessage({ type: 'error', text: 'UTR can only be submitted for bills in PENDING status.' });
            return;
        }
        if (!utrNumber.trim()) {
            setMessage({ type: 'error', text: 'Please enter UTR Number.' });
            return;
        }

        setSubmittingUtr(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await apiFetch(API_ENDPOINTS.MESS_SUBMIT_UTR, {
                method: 'POST',
                body: JSON.stringify({ billId: bill._id, utrNumber: utrNumber.trim() })
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                setMessage({ type: 'error', text: data.message || 'Failed to submit UTR.' });
            } else {
                setBill(data.data);
                setUtrNumber(data.data?.utrNumber || '');
                setMessage({ type: 'success', text: data.message || 'UTR submitted successfully.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to submit UTR.' });
        } finally {
            setSubmittingUtr(false);
        }
    };

    const submitMessOff = async (e) => {
        e.preventDefault();
        if (!messOffForm.startDate || !messOffForm.endDate) {
            setMessage({ type: 'error', text: 'Please select start and end dates for mess off.' });
            return;
        }
        if (new Date(messOffForm.endDate) < new Date(messOffForm.startDate)) {
            setMessage({ type: 'error', text: 'End date must be on or after start date.' });
            return;
        }

        setSubmittingMessOff(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await apiFetch(API_ENDPOINTS.MESS_OFF, {
                method: 'POST',
                body: JSON.stringify({
                    startDate: messOffForm.startDate,
                    endDate: messOffForm.endDate
                })
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                setMessage({ type: 'error', text: data.message || 'Failed to submit mess off request.' });
            } else {
                setMessOffForm({ startDate: '', endDate: '' });
                setMessage({ type: 'success', text: data.message || 'Mess off request submitted.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to submit mess off request.' });
        } finally {
            setSubmittingMessOff(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-900 text-white pt-28 px-4 flex items-center justify-center">
                <p className="text-gray-300">Please login to view your mess dashboard.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 pt-28 px-4 pb-10">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                    <h1 className="text-2xl font-bold text-slate-200">Mess Dashboard</h1>
                    <p className="text-gray-400 text-sm mt-1">Billing and payment verification</p>
                </div>

                {message.text && (
                    <div className={`rounded-xl border px-4 py-3 text-sm ${
                        message.type === 'success'
                            ? 'bg-green-900/20 border-green-700 text-green-300'
                            : message.type === 'info'
                                ? 'bg-indigo-900/20 border-indigo-700 text-indigo-300'
                                : 'bg-red-900/20 border-red-700 text-red-300'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-200">Current Pending Bill</h2>
                            {bill?.status && (
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    bill.status === 'VERIFICATION'
                                        ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                                        : bill.status === 'PAID'
                                            ? 'bg-green-900/30 text-green-300 border border-green-700'
                                            : 'bg-red-900/30 text-red-300 border border-red-700'
                                }`}>
                                    {bill.status}
                                </span>
                            )}
                        </div>

                        {loadingBill ? (
                            <p className="text-gray-400">Loading bill...</p>
                        ) : bill ? (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-400">Billing Cycle: <span className="text-gray-200">{monthLabel}</span></p>

                                <div className="rounded-xl bg-gray-900 border border-gray-700 divide-y divide-gray-700">
                                    <div className="flex justify-between px-4 py-3 text-sm">
                                        <span className="text-gray-300">Base Fee</span>
                                        <span className="font-semibold text-gray-100">{formatCurrency(bill.baseFee || 5200)}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-3 text-sm">
                                        <span className="text-gray-300">Arrears</span>
                                        <span className="font-semibold text-orange-300">{formatCurrency(bill.arrears || 0)}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-3 text-sm">
                                        <span className="text-gray-300">Mess Off Deduction</span>
                                        <span className="font-semibold text-green-300">- {formatCurrency(bill.messOffRebate || 0)}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-3 text-base">
                                        <span className="font-semibold text-slate-200">Total Payable</span>
                                        <span className="font-bold text-indigo-300">{formatCurrency(bill.totalDue || 0)}</span>
                                    </div>
                                </div>

                                {bill.status === 'PENDING' && (
                                    <form className="space-y-3 pt-2" onSubmit={submitUtr}>
                                        <label className="block text-sm text-gray-300 font-medium">UTR Number</label>
                                        <input
                                            type="text"
                                            value={utrNumber}
                                            onChange={(e) => setUtrNumber(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Enter UTR Number"
                                        />
                                        <button
                                            type="submit"
                                            disabled={submittingUtr}
                                            className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
                                        >
                                            {submittingUtr ? 'Submitting...' : 'Submit Payment'}
                                        </button>
                                    </form>
                                )}

                                {bill.status === 'VERIFICATION' && (
                                    <p className="rounded-lg border border-yellow-700 bg-yellow-900/20 text-yellow-300 text-sm px-3 py-2">
                                        UTR already submitted. Payment is under admin verification.
                                    </p>
                                )}

                                {bill.status === 'PAID' && (
                                    <p className="rounded-lg border border-green-700 bg-green-900/20 text-green-300 text-sm px-3 py-2">
                                        This bill is marked as PAID.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400">No bill available right now.</p>
                        )}
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-slate-200 mb-4">Apply for Mess Off</h2>
                        <form className="space-y-4" onSubmit={submitMessOff}>
                            <div>
                                <label className="block text-sm text-gray-300 font-medium mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={messOffForm.startDate}
                                    onChange={(e) => setMessOffForm((prev) => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 font-medium mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={messOffForm.endDate}
                                    onChange={(e) => setMessOffForm((prev) => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    min={messOffForm.startDate || new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submittingMessOff}
                                className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
                            >
                                {submittingMessOff ? 'Submitting...' : 'Apply Mess Off'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">Recent Bills</h2>

                    {loadingBill ? (
                        <p className="text-gray-400">Loading history...</p>
                    ) : billHistory.length === 0 ? (
                        <p className="text-gray-400">No bill history available yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-gray-400 border-b border-gray-700">
                                    <tr>
                                        <th className="text-left py-2 pr-4">Cycle</th>
                                        <th className="text-left py-2 pr-4">Total Due</th>
                                        <th className="text-left py-2 pr-4">Status</th>
                                        <th className="text-left py-2">UTR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billHistory.map((historyBill) => {
                                        const cycle = new Date(historyBill.year, historyBill.month - 1, 1).toLocaleString('en-IN', {
                                            month: 'short',
                                            year: 'numeric'
                                        });

                                        return (
                                            <tr key={historyBill._id} className="border-b border-gray-800">
                                                <td className="py-2 pr-4 text-gray-200">{cycle}</td>
                                                <td className="py-2 pr-4 text-gray-100 font-medium">{formatCurrency(historyBill.totalDue || 0)}</td>
                                                <td className="py-2 pr-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        historyBill.status === 'PAID'
                                                            ? 'bg-green-900/30 text-green-300 border border-green-700'
                                                            : historyBill.status === 'VERIFICATION'
                                                                ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                                                                : 'bg-red-900/30 text-red-300 border border-red-700'
                                                    }`}>
                                                        {historyBill.status}
                                                    </span>
                                                </td>
                                                <td className="py-2 text-gray-300">{historyBill.utrNumber || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MessBill;

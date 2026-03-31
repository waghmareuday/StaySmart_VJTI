import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rs ${amount.toLocaleString('en-IN')}`;
};

function MessOff() {
  const now = new Date();
  const [pendingMessOff, setPendingMessOff] = useState([]);
  const [verificationBills, setVerificationBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionKey, setActionKey] = useState('');
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [isPublishingBills, setIsPublishingBills] = useState(false);
  const [billingMonth, setBillingMonth] = useState(now.getMonth() + 1);
  const [billingYear, setBillingYear] = useState(now.getFullYear());
  const [generationSummary, setGenerationSummary] = useState(null);
  const [previewSummary, setPreviewSummary] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [existingRows, setExistingRows] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [allowRegenerateExisting, setAllowRegenerateExisting] = useState(false);
  const [isSeedingMissingUsers, setIsSeedingMissingUsers] = useState(false);

  const parseApiResponse = async (response) => {
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const rawText = await response.text();
    let data = null;

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }
    }

    if (!data) {
      const looksLikeHtml = rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html') || contentType.includes('text/html');
      if (looksLikeHtml) {
        throw new Error('Backend returned HTML instead of JSON. Please restart backend and verify VITE_API_URL points to API server.');
      }
      throw new Error(`Invalid response from server (${response.status}).`);
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || `Request failed (${response.status}).`);
    }

    return data;
  };

  const fetchJson = async (url, options = {}) => {
    const response = await apiFetch(url, options);
    return parseApiResponse(response);
  };

  const requestMessBillPreview = async (payload) => {
    const attempts = [
      {
        url: API_ENDPOINTS.ADMIN_MESS_BILLS_PREVIEW,
        options: {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      },
      {
        url: `${API_ENDPOINTS.ADMIN_MESS_BILLS_GENERATE}?preview=true`,
        options: {
          method: 'POST',
          body: JSON.stringify({ ...payload, preview: true })
        }
      }
    ];

    let lastError = null;
    for (const attempt of attempts) {
      try {
        return await fetchJson(attempt.url, attempt.options);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Unable to load preview.');
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [messOffData, verificationData] = await Promise.all([
        fetchJson(API_ENDPOINTS.ADMIN_MESSOFF_PENDING),
        fetchJson(API_ENDPOINTS.ADMIN_MESS_BILLS_VERIFICATION)
      ]);

      setPendingMessOff(messOffData.data || []);
      setVerificationBills(verificationData.data || []);
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load verification data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMessOffAction = async (requestId, action) => {
    const key = `messoff-${requestId}-${action}`;
    setActionKey(key);
    setError('');
    setSuccess('');

    try {
      const endpoint = action === 'approve'
        ? API_ENDPOINTS.ADMIN_MESSOFF_APPROVE(requestId)
        : API_ENDPOINTS.ADMIN_MESSOFF_REJECT(requestId);

      const response = await fetchJson(endpoint, { method: 'PATCH' });

      setSuccess(response.message || `Mess-off request ${action}d successfully.`);
      setPendingMessOff((prev) => prev.filter((item) => item._id !== requestId));
    } catch (actionError) {
      setError(actionError.message || `Failed to ${action} mess-off request.`);
    } finally {
      setActionKey('');
    }
  };

  const handleBillAction = async (billId, action) => {
    const key = `bill-${billId}-${action}`;
    setActionKey(key);
    setError('');
    setSuccess('');

    try {
      const endpoint = action === 'approve'
        ? API_ENDPOINTS.ADMIN_MESS_BILLS_APPROVE(billId)
        : API_ENDPOINTS.ADMIN_MESS_BILLS_REJECT(billId);

      const response = await fetchJson(endpoint, { method: 'PATCH' });

      setSuccess(response.message || `Bill ${action}d successfully.`);
      setVerificationBills((prev) => prev.filter((item) => item._id !== billId));
    } catch (actionError) {
      setError(actionError.message || `Failed to ${action} bill.`);
    } finally {
      setActionKey('');
    }
  };

  const handleGenerateMessBillPreview = async () => {
    setIsPreparingPreview(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        month: Number(billingMonth),
        year: Number(billingYear),
        regenerateExisting: allowRegenerateExisting
      };

      const response = await requestMessBillPreview(payload);

      setPreviewSummary(response.summary || null);
      setPreviewRows(response.previewList || []);
      setExistingRows(response.existingBillList || []);
      setIsPreviewOpen(true);

      if ((response.previewList || []).length === 0 && (response.summary?.skippedExisting || 0) > 0 && !allowRegenerateExisting) {
        setSuccess('Bills already exist for this month. Enable "Recalculate existing unpaid bills" to update them or switch month/year.');
      } else {
        setSuccess(response.message || 'Preview generated successfully.');
      }
    } catch (actionError) {
      setError(actionError.message || 'Failed to generate preview for monthly mess bills.');
    } finally {
      setIsPreparingPreview(false);
    }
  };

  const handlePublishMessBills = async () => {
    setIsPublishingBills(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetchJson(API_ENDPOINTS.ADMIN_MESS_BILLS_GENERATE, {
        method: 'POST',
        body: JSON.stringify({
          month: Number(billingMonth),
          year: Number(billingYear),
          regenerateExisting: allowRegenerateExisting
        })
      });

      setGenerationSummary(response.summary || null);
      setSuccess(response.message || 'Monthly mess bills generated successfully.');
      setIsPreviewOpen(false);
      setPreviewRows([]);
      setExistingRows([]);
      setPreviewSummary(null);
      await fetchData();
    } catch (actionError) {
      setError(actionError.message || 'Failed to publish monthly mess bills.');
    } finally {
      setIsPublishingBills(false);
    }
  };

  const handleSeedMissingUsersAndRetryPreview = async () => {
    setIsSeedingMissingUsers(true);
    setError('');

    try {
      const response = await fetchJson(API_ENDPOINTS.ADMIN_SEED_STUDENT_USERS, {
        method: 'POST',
        body: JSON.stringify({ onlyAllotted: true })
      });

      const created = response.summary?.createdUsers || 0;
      setSuccess(
        created > 0
          ? `Created ${created} missing student profiles. Refreshing preview...`
          : 'No new student profiles were created. Refreshing preview...'
      );

      await handleGenerateMessBillPreview();
    } catch (seedError) {
      setError(seedError.message || 'Failed to seed missing student profiles.');
    } finally {
      setIsSeedingMissingUsers(false);
    }
  };

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">MessOff & UTR Verification</h1>
            <p className="text-sm text-gray-400">Approve or reject mess-off requests and UTR submissions.</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-700 bg-red-900/30 text-red-300 px-4 py-3">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-700 bg-green-900/30 text-green-300 px-4 py-3">
            {success}
          </div>
        )}

        <section className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1">Month</label>
              <input
                type="number"
                min="1"
                max="12"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="w-28 px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1">Year</label>
              <input
                type="number"
                min="2000"
                value={billingYear}
                onChange={(e) => setBillingYear(e.target.value)}
                className="w-32 px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300 pb-2">
              <input
                type="checkbox"
                checked={allowRegenerateExisting}
                onChange={(e) => setAllowRegenerateExisting(e.target.checked)}
                className="accent-indigo-600"
              />
              Recalculate existing unpaid bills
            </label>
            <button
              onClick={handleGenerateMessBillPreview}
              disabled={isPreparingPreview}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {isPreparingPreview ? 'Preparing Preview...' : 'Generate Monthly Mess Bills'}
            </button>
          </div>

          {generationSummary && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                <p className="text-gray-400">Allotted Students</p>
                <p className="text-gray-100 font-semibold">{generationSummary.totalAllotted || 0}</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                <p className="text-gray-400">Bills Created</p>
                <p className="text-green-300 font-semibold">{generationSummary.billsCreated || 0}</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                <p className="text-gray-400">Bills Updated</p>
                <p className="text-blue-300 font-semibold">{generationSummary.billsUpdated || 0}</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                <p className="text-gray-400">Missing User Links</p>
                <p className="text-red-300 font-semibold">{generationSummary.skippedMissingUsers || 0}</p>
              </div>
            </div>
          )}
        </section>

        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
            <div className="w-full max-w-6xl max-h-[90vh] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">Monthly Mess Bill Preview</h3>
                  <p className="text-xs text-gray-400">Billing period: {billingMonth}/{billingYear}</p>
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-3 py-1.5 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition"
                >
                  Close
                </button>
              </div>

              {previewSummary && (
                <div className="p-4 border-b border-gray-700 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3 text-sm">
                  <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                    <p className="text-gray-400">Allotted</p>
                    <p className="font-semibold">{previewSummary.totalAllotted || 0}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                    <p className="text-gray-400">Will Create</p>
                    <p className="font-semibold text-green-300">{previewSummary.previewCreateCount || 0}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                    <p className="text-gray-400">Will Update</p>
                    <p className="font-semibold text-blue-300">{previewSummary.previewUpdateCount || 0}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                    <p className="text-gray-400">Skipped Existing</p>
                    <p className="font-semibold text-yellow-300">{previewSummary.skippedExisting || 0}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                    <p className="text-gray-400">Skipped Paid</p>
                    <p className="font-semibold text-purple-300">{previewSummary.skippedPaidExisting || 0}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                    <p className="text-gray-400">Missing Links</p>
                    <p className="font-semibold text-red-300">{previewSummary.skippedMissingUsers || 0}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                    <p className="text-gray-400">Projected Due</p>
                    <p className="font-semibold">{formatCurrency(previewSummary.totalProjectedDue)}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2">
                    <p className="text-gray-400">Projected Rebate</p>
                    <p className="font-semibold">{formatCurrency(previewSummary.totalProjectedRebate)}</p>
                  </div>
                </div>
              )}

              <div className="overflow-auto max-h-[52vh]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-300 uppercase text-xs sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">Operation</th>
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">College ID</th>
                      <th className="px-4 py-3 text-left">Current Balance</th>
                      <th className="px-4 py-3 text-left">Base</th>
                      <th className="px-4 py-3 text-left">Arrears</th>
                      <th className="px-4 py-3 text-left">Leave Days</th>
                      <th className="px-4 py-3 text-left">Rebate</th>
                      <th className="px-4 py-3 text-left">Total Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {previewRows.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-400">
                          {(previewSummary?.skippedExisting || 0) > 0 && !allowRegenerateExisting
                            ? `No new bills to create. ${previewSummary.skippedExisting} bills already exist for this month/year. Enable \"Recalculate existing unpaid bills\" to update them.`
                            : 'No actionable bills for this month/year.'}
                        </td>
                      </tr>
                    ) : (
                      previewRows.map((row) => (
                        <tr key={row.studentDbId} className="hover:bg-gray-700/40">
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${row.operation === 'UPDATE_EXISTING' ? 'bg-blue-900/40 text-blue-300' : 'bg-green-900/40 text-green-300'}`}>
                              {row.operation === 'UPDATE_EXISTING' ? 'Update' : 'Create'}
                            </span>
                          </td>
                          <td className="px-4 py-3">{row.studentName || 'Unknown Student'}</td>
                          <td className="px-4 py-3">{row.collegeId || '-'}</td>
                          <td className="px-4 py-3">{formatCurrency(row.currentMessBalance)}</td>
                          <td className="px-4 py-3">{formatCurrency(row.baseFee)}</td>
                          <td className="px-4 py-3">{formatCurrency(row.arrears)}</td>
                          <td className="px-4 py-3">{row.approvedLeaveDays || 0}</td>
                          <td className="px-4 py-3">{formatCurrency(row.messOffRebate)}</td>
                          <td className="px-4 py-3 font-semibold text-green-300">{formatCurrency(row.totalDue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {existingRows.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-700 bg-gray-900/30 text-xs text-gray-300">
                  Existing bills found for this cycle: {existingRows.length}
                </div>
              )}

              {(previewSummary?.skippedMissingUsers || 0) > 0 && (
                <div className="px-5 py-3 border-t border-amber-700 bg-amber-900/20 text-xs text-amber-200 flex items-center justify-between gap-3">
                  <p>
                    {previewSummary.skippedMissingUsers} allotted students are missing linked student profiles, so bills cannot be generated for them.
                  </p>
                  <button
                    onClick={handleSeedMissingUsersAndRetryPreview}
                    disabled={isSeedingMissingUsers}
                    className="px-3 py-1.5 rounded bg-amber-700 text-white hover:bg-amber-600 disabled:opacity-50 transition whitespace-nowrap"
                  >
                    {isSeedingMissingUsers ? 'Creating Profiles...' : 'Create Missing Test Profiles + Retry'}
                  </button>
                </div>
              )}

              <div className="px-5 py-4 border-t border-gray-700 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishMessBills}
                  disabled={isPublishingBills || previewRows.length === 0}
                  className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {isPublishingBills ? 'Publishing...' : 'Publish Bills'}
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending MessOff Requests</h2>
            <span className="text-sm text-gray-400">{pendingMessOff.length} pending</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">College ID</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Start</th>
                  <th className="px-4 py-3 text-left">End</th>
                  <th className="px-4 py-3 text-left">Days</th>
                  <th className="px-4 py-3 text-left">Requested</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400">Loading pending requests...</td>
                  </tr>
                ) : pendingMessOff.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400">No pending mess-off requests.</td>
                  </tr>
                ) : (
                  pendingMessOff.map((request) => {
                    const student = request.studentId || {};
                    const approveKey = `messoff-${request._id}-approve`;
                    const rejectKey = `messoff-${request._id}-reject`;
                    const isProcessing = actionKey === approveKey || actionKey === rejectKey;

                    return (
                      <tr key={request._id} className="hover:bg-gray-700/40">
                        <td className="px-4 py-3">{student.name || 'Unknown Student'}</td>
                        <td className="px-4 py-3">{student.collegeId || '-'}</td>
                        <td className="px-4 py-3">{student.email || '-'}</td>
                        <td className="px-4 py-3">{formatDate(request.startDate)}</td>
                        <td className="px-4 py-3">{formatDate(request.endDate)}</td>
                        <td className="px-4 py-3">{request.approvedDays}</td>
                        <td className="px-4 py-3">{formatDate(request.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleMessOffAction(request._id, 'approve')}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded bg-green-900/40 text-green-300 hover:bg-green-900/60 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleMessOffAction(request._id, 'reject')}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded bg-red-900/40 text-red-300 hover:bg-red-900/60 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-gray-800 border border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold">UTR Verification Queue</h2>
            <span className="text-sm text-gray-400">{verificationBills.length} awaiting verification</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-300 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">College ID</th>
                  <th className="px-4 py-3 text-left">Billing Period</th>
                  <th className="px-4 py-3 text-left">UTR Number</th>
                  <th className="px-4 py-3 text-left">Total Due</th>
                  <th className="px-4 py-3 text-left">Arrears</th>
                  <th className="px-4 py-3 text-left">Rebate</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400">Loading verification bills...</td>
                  </tr>
                ) : verificationBills.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400">No bills are pending UTR verification.</td>
                  </tr>
                ) : (
                  verificationBills.map((bill) => {
                    const student = bill.studentId || {};
                    const approveKey = `bill-${bill._id}-approve`;
                    const rejectKey = `bill-${bill._id}-reject`;
                    const isProcessing = actionKey === approveKey || actionKey === rejectKey;

                    return (
                      <tr key={bill._id} className="hover:bg-gray-700/40">
                        <td className="px-4 py-3">{student.name || 'Unknown Student'}</td>
                        <td className="px-4 py-3">{student.collegeId || '-'}</td>
                        <td className="px-4 py-3">{`${bill.month}/${bill.year}`}</td>
                        <td className="px-4 py-3 font-medium">{bill.utrNumber || '-'}</td>
                        <td className="px-4 py-3">{formatCurrency(bill.totalDue)}</td>
                        <td className="px-4 py-3">{formatCurrency(bill.arrears)}</td>
                        <td className="px-4 py-3">{formatCurrency(bill.messOffRebate)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleBillAction(bill._id, 'approve')}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded bg-green-900/40 text-green-300 hover:bg-green-900/60 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleBillAction(bill._id, 'reject')}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded bg-red-900/40 text-red-300 hover:bg-red-900/60 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default MessOff;

import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

/**
 * Admin Attendance Dashboard
 * - Stats overview
 * - Nightly Exception Report
 * - Chronic Absentees Widget
 * - One-Click Alert Dispatch
 */
function AttendanceAdmin() {
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [chronicAbsentees, setChronicAbsentees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [activeTab, setActiveTab] = useState('report');

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchReport(selectedDate), fetchChronicAbsentees()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_ATTENDANCE_STATS);
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReport = async (date) => {
    try {
      const url = date 
        ? API_ENDPOINTS.ADMIN_ATTENDANCE_REPORT(date)
        : API_ENDPOINTS.ADMIN_ATTENDANCE_REPORT_TODAY;
      const res = await apiFetch(url);
      const data = await res.json();
      if (data.success) setReport(data.report);
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  const fetchChronicAbsentees = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_ATTENDANCE_CHRONIC);
      const data = await res.json();
      if (data.success) setChronicAbsentees(data.absentees);
    } catch (error) {
      console.error('Error fetching chronic absentees:', error);
    }
  };

  const dispatchAlerts = async () => {
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_ATTENDANCE_DISPATCH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      });
      const data = await res.json();
      if (data.success) {
        setDispatchResult(data);
        // Refresh report to update alert status
        await fetchReport(selectedDate);
        await fetchStats();
      }
    } catch (error) {
      console.error('Error dispatching alerts:', error);
      alert('Failed to dispatch alerts');
    }
    setDispatching(false);
  };

  const deleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    
    try {
      const res = await apiFetch(API_ENDPOINTS.ADMIN_ATTENDANCE_DELETE(recordId), {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await fetchReport(selectedDate);
        await fetchStats();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96 bg-gray-900 text-gray-100">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-900 text-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">📊 Attendance Dashboard</h1>
        <p className="text-gray-400 mt-1">Smart attendance tracking & escalation system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl shadow p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Today's Absences</p>
              <p className="text-3xl font-bold text-red-500">{stats?.today?.absences || 0}</p>
            </div>
            <span className="text-4xl">🚫</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow p-5 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending Alerts</p>
              <p className="text-3xl font-bold text-yellow-500">{stats?.today?.pendingAlerts || 0}</p>
            </div>
            <span className="text-4xl">⏳</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow p-5 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">This Month</p>
              <p className="text-3xl font-bold text-orange-500">{stats?.thisMonth || 0}</p>
            </div>
            <span className="text-4xl">📅</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow p-5 border-l-4 border-violet-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Chronic Absentees</p>
              <p className="text-3xl font-bold text-purple-500">{stats?.chronicAbsenteesCount || 0}</p>
            </div>
            <span className="text-4xl">⚠️</span>
          </div>
        </div>
      </div>

      {/* Today's Block Distribution */}
      {stats?.today?.byBlock && Object.keys(stats.today.byBlock).length > 0 && (
        <div className="bg-gray-800 rounded-xl shadow p-5 mb-6 border border-gray-700">
          <h3 className="font-semibold text-gray-100 mb-3">Today's Absences by Block</h3>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(stats.today.byBlock).map(([block, count]) => (
              <div key={block} className="bg-gray-700 px-4 py-2 rounded-lg border border-gray-600">
                <span className="font-bold text-indigo-300">Block {block}:</span>
                <span className="ml-2 text-red-500">{count} absent</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'report'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          📋 Exception Report
        </button>
        <button
          onClick={() => setActiveTab('chronic')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'chronic'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          ⚠️ Chronic Absentees ({chronicAbsentees.length})
        </button>
      </div>

      {/* Exception Report Tab */}
      {activeTab === 'report' && (
        <div className="bg-gray-800 rounded-xl shadow border border-gray-700">
          {/* Report Header */}
          <div className="p-5 border-b border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-100">
                  🌙 Nightly Exception Report
                </h2>
                <p className="text-sm text-gray-400">Only absent students are listed</p>
              </div>
              
              <div className="flex gap-3 items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-100"
                />
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Dispatch Alerts Button */}
            {report?.summary?.alertsPending > 0 && (
              <div className="mt-4 p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/60">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-medium text-yellow-200">
                      ⚠️ {report.summary.alertsPending} alerts pending dispatch
                    </p>
                    <p className="text-sm text-yellow-400">
                      Strike 1: {report.summary.strike1} friendly emails • Strike 2: {report.summary.strike2} escalated to Chief Warden
                    </p>
                  </div>
                  <button
                    onClick={dispatchAlerts}
                    disabled={dispatching}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {dispatching ? (
                      <>
                        <span className="animate-spin">⏳</span> Sending...
                      </>
                    ) : (
                      <>
                        📧 Dispatch Alerts
                      </>
                    )}
                  </button>
                </div>

                {dispatchResult && (
                  <div className="mt-3 p-3 bg-green-900/30 rounded-lg border border-green-700/50">
                    <p className="text-green-300 font-medium">✅ Alerts dispatched successfully!</p>
                    <p className="text-sm text-green-400">
                      Strike 1 sent: {dispatchResult.summary?.strike1Sent || 0} • 
                      Strike 2 sent: {dispatchResult.summary?.strike2Sent || 0} • 
                      Failed: {dispatchResult.summary?.failed || 0}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Report Summary */}
          <div className="p-5 border-b border-gray-700 bg-gray-900/70">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-red-500">{report?.summary?.totalAbsent || 0}</p>
                <p className="text-sm text-gray-400">Total Absent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{report?.summary?.strike1 || 0}</p>
                <p className="text-sm text-gray-400">Strike 1</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{report?.summary?.strike2 || 0}</p>
                <p className="text-sm text-gray-400">Strike 2</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{report?.summary?.alertsPending || 0}</p>
                <p className="text-sm text-gray-400">Alerts Pending</p>
              </div>
            </div>
          </div>

          {/* Absent Students by Block */}
          <div className="p-5">
            {report?.summary?.totalAbsent === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-green-400">Perfect Attendance!</h3>
                <p className="text-gray-400 mt-2">No absences recorded for {selectedDate}</p>
              </div>
            ) : (
              Object.entries(report?.byBlock || {}).map(([block, students]) => (
                <div key={block} className="mb-6 last:mb-0">
                  <h3 className="font-semibold text-gray-100 mb-3 flex items-center gap-2">
                    <span className="bg-indigo-900/40 text-indigo-300 px-2 py-1 rounded">
                      Block {block}
                    </span>
                    <span className="text-sm text-gray-400">({students.length} absent)</span>
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-900 text-gray-300">
                        <tr>
                          <th className="px-4 py-2 text-left">Room</th>
                          <th className="px-4 py-2 text-left">Student</th>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-center">Strike</th>
                          <th className="px-4 py-2 text-center">Alert</th>
                          <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {students.map((student, idx) => (
                          <tr key={idx} className="hover:bg-gray-700/40">
                            <td className="px-4 py-3 font-medium">{student.room}</td>
                            <td className="px-4 py-3">
                              <div>{student.name}</div>
                              <div className="text-xs text-gray-400">{student.studentId}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-300">{student.email}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                student.escalationLevel >= 2 
                                  ? 'bg-red-900/30 text-red-300' 
                                  : 'bg-yellow-900/30 text-yellow-300'
                              }`}>
                                {student.escalationLevel >= 2 ? '🚨 Strike 2' : '⚠️ Strike 1'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {student.alertSent ? (
                                <span className="text-green-400">✅ Sent</span>
                              ) : (
                                <span className="text-gray-400">⏳ Pending</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  const record = report.allAbsences.find(
                                    a => a.studentId === student.studentId
                                  );
                                  if (record) deleteRecord(record._id);
                                }}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                title="Delete (if marked by mistake)"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chronic Absentees Tab */}
      {activeTab === 'chronic' && (
        <div className="bg-gray-800 rounded-xl shadow border border-gray-700">
          <div className="p-5 border-b border-gray-700">
            <h2 className="text-xl font-bold text-gray-100">
              ⚠️ Chronic Absentees
            </h2>
            <p className="text-sm text-gray-400">Students with more than 3 absences this month</p>
          </div>

          <div className="p-5">
            {chronicAbsentees.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-semibold text-green-400">No Chronic Absentees!</h3>
                <p className="text-gray-400 mt-2">All students have good attendance this month</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chronicAbsentees.map((student, idx) => (
                  <div 
                    key={idx} 
                    className="bg-red-900/20 border border-red-700 rounded-lg p-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                          {student.absenceCount}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-100">{student.studentName}</h4>
                          <p className="text-sm text-gray-400">{student._id} • Room {student.roomNumber}, Block {student.hostelBlock}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Last absent:</p>
                        <p className="font-medium text-red-400">
                          {new Date(student.lastAbsent).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Absence dates */}
                    <div className="mt-3 pt-3 border-t border-red-700">
                      <p className="text-xs text-gray-400 mb-2">Absence dates this month:</p>
                      <div className="flex flex-wrap gap-2">
                        {student.absenceDates?.map((date, i) => (
                          <span key={i} className="bg-red-900/40 text-red-300 px-2 py-1 rounded text-xs">
                            {new Date(date).toLocaleDateString()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <a 
                        href={`mailto:${student.studentEmail}?subject=Attendance%20Warning&body=Dear%20${student.studentName},%0A%0AYou%20have%20been%20marked%20absent%20${student.absenceCount}%20times%20this%20month.%20Please%20meet%20the%20warden%20immediately.`}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                      >
                        📧 Send Warning Email
                      </a>
                      <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                        📞 Contact Parent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <h4 className="font-semibold text-gray-200 mb-2">Escalation Rules:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
          <div><span className="text-yellow-500">⚠️ Strike 1:</span> First absence — Friendly email to student</div>
          <div><span className="text-red-500">🚨 Strike 2:</span> Consecutive absence — Email + CC to Chief Warden</div>
          <div><span className="text-purple-500">⛔ Chronic:</span> 3+ absences in a month — Requires immediate intervention</div>
          <div><span className="text-blue-500">🎫 Auto-Excused:</span> Students with approved leave are automatically excused</div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceAdmin;

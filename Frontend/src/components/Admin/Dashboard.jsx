import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import myHook from "../Context";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { API_ENDPOINTS, apiFetch } from '../../config/api';

// Register chart components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

function Dashboard() {
  const { user, setUser } = myHook();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [hostelFeedback, setHostelFeedback] = useState([]);
  const [messFeedback, setMessFeedback] = useState([]);
  const [data, setData] = useState();
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [chronicAbsentees, setChronicAbsentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Smart insights based on data
  const [insights, setInsights] = useState([]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchData(),
      fetchComplaints(),
      fetchHostelFeedback(),
      fetchMessFeedback(),
      fetchAttendanceStats(),
      fetchChronicAbsentees()
    ]);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Generate smart insights when data changes
  useEffect(() => {
    generateInsights();
  }, [complaints, hostelFeedback, messFeedback, attendanceStats, chronicAbsentees]);

  const generateInsights = () => {
    const newInsights = [];
    
    // Complaint trends
    const recentComplaints = complaints.filter(c => {
      const date = new Date(c.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    });
    
    if (recentComplaints.length > 5) {
      newInsights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'High Complaint Volume',
        desc: `${recentComplaints.length} complaints this week. Consider addressing common issues.`,
        action: '/admin/complaint'
      });
    }

    // Feedback sentiment
    const avgHostelRating = hostelFeedback.length > 0 
      ? hostelFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / hostelFeedback.length 
      : 0;
    
    if (avgHostelRating < 3 && hostelFeedback.length > 0) {
      newInsights.push({
        type: 'alert',
        icon: '📉',
        title: 'Low Hostel Satisfaction',
        desc: `Average rating: ${avgHostelRating.toFixed(1)}/5. Review recent feedback.`,
        action: '/admin/hostelfeedback'
      });
    }

    // Attendance alerts
    if (chronicAbsentees.length > 0) {
      newInsights.push({
        type: 'info',
        icon: '🚨',
        title: 'Attendance Alert',
        desc: `${chronicAbsentees.length} student(s) have chronic absences (>3/month).`,
        action: '/admin/attendance'
      });
    }

    // Pending alerts
    if (attendanceStats?.today?.pendingAlerts > 0) {
      newInsights.push({
        type: 'action',
        icon: '📧',
        title: 'Pending Email Alerts',
        desc: `${attendanceStats.today.pendingAlerts} absence alerts ready to dispatch.`,
        action: '/admin/attendance'
      });
    }

    setInsights(newInsights);
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_STATS);
      setData(response.data);
    } catch (err) {
      console.error("Error fetching counts:", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_COMPLAINT);
      setComplaints(response.data.Complaint || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  const fetchHostelFeedback = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_HOSTEL_FEEDBACK);
      setHostelFeedback(response.data.hostelfeedback || []);
    } catch (error) {
      console.error("Error fetching hostel feedback:", error);
    }
  };

  const fetchMessFeedback = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_MESS_FEEDBACK);
      setMessFeedback(response.data.messfeedback || []);
    } catch (error) {
      console.error("Error fetching mess feedback:", error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.ADMIN_ATTENDANCE_STATS);
      const data = await response.json();
      if (data.success) setAttendanceStats(data.stats);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
    }
  };

  const fetchChronicAbsentees = async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.ADMIN_ATTENDANCE_CHRONIC);
      const data = await response.json();
      if (data.success) setChronicAbsentees(data.absentees || []);
    } catch (error) {
      console.error("Error fetching chronic absentees:", error);
    }
  };

  // Chart configurations
  const groupComplaintsByDate = () => {
    const groupedComplaints = {};
    complaints.forEach(complaint => {
      const date = new Date(complaint.date).toLocaleDateString();
      if (!groupedComplaints[date]) groupedComplaints[date] = 0;
      groupedComplaints[date]++;
    });
    return groupedComplaints;
  };

  const complaintsGroupedByDate = groupComplaintsByDate();
  const complaintDates = Object.keys(complaintsGroupedByDate).slice(-7);
  const complaintCounts = complaintDates.map(d => complaintsGroupedByDate[d] || 0);

  const occupancyData = {
    labels: ['Allotted', 'Not Allotted'],
    datasets: [{
      data: [data?.HostelAllotted || 0, data?.HostelNotAllotted || 0],
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
      borderWidth: 2,
    }]
  };

  const complaintsChartData = {
    labels: complaintDates,
    datasets: [{
      label: 'Complaints',
      data: complaintCounts,
      backgroundColor: 'rgba(239, 68, 68, 0.6)',
      borderColor: 'rgb(239, 68, 68)',
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  const attendanceChartData = {
    labels: ['Present', 'Absent', 'On Leave'],
    datasets: [{
      data: [
        (data?.HostelAllotted || 0) - (attendanceStats?.today?.absences || 0),
        attendanceStats?.today?.absences || 0,
        0
      ],
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(59, 130, 246, 0.8)'],
      borderWidth: 0,
    }]
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Welcome back, {user?.name || 'Admin'} • Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchAllData}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Smart Insights Banner */}
      {insights.length > 0 && (
        <div className="mb-6 space-y-2">
          {insights.slice(0, 3).map((insight, idx) => (
            <Link
              key={idx}
              to={insight.action}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.01] ${
                insight.type === 'warning' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                insight.type === 'alert' ? 'bg-red-500/20 border border-red-500/30' :
                insight.type === 'action' ? 'bg-blue-500/20 border border-blue-500/30' :
                'bg-gray-700/50 border border-gray-600'
              }`}
            >
              <span className="text-2xl">{insight.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-white">{insight.title}</p>
                <p className="text-sm text-gray-300">{insight.desc}</p>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-indigo-600 p-4 rounded-xl shadow-lg">
          <div className="text-indigo-100 text-sm mb-1">Total Students</div>
          <div className="text-3xl font-bold text-white">{data?.totalCountStudents || 0}</div>
        </div>
        <div className="bg-green-600 p-4 rounded-xl shadow-lg">
          <div className="text-green-200 text-sm mb-1">Hostel Allotted</div>
          <div className="text-3xl font-bold text-white">{data?.HostelAllotted || 0}</div>
        </div>
        <div className="bg-yellow-600 p-4 rounded-xl shadow-lg">
          <div className="text-yellow-200 text-sm mb-1">Pending Allotment</div>
          <div className="text-3xl font-bold text-white">{data?.HostelNotAllotted || 0}</div>
        </div>
        <div className="bg-red-600 p-4 rounded-xl shadow-lg">
          <div className="text-red-200 text-sm mb-1">Complaints</div>
          <div className="text-3xl font-bold text-white">{complaints.length}</div>
        </div>
        <div className="bg-violet-600 p-4 rounded-xl shadow-lg">
          <div className="text-violet-200 text-sm mb-1">Today Absent</div>
          <div className="text-3xl font-bold text-white">{attendanceStats?.today?.absences || 0}</div>
        </div>
        <div className="bg-indigo-700 p-4 rounded-xl shadow-lg">
          <div className="text-indigo-200 text-sm mb-1">Chronic Absents</div>
          <div className="text-3xl font-bold text-white">{chronicAbsentees.length}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Occupancy Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Room Occupancy</h3>
          <div className="h-48 flex items-center justify-center">
            <Doughnut data={occupancyData} options={{ maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } } }} />
          </div>
        </div>

        {/* Complaints Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Complaints (Last 7 Days)</h3>
          <div className="h-48">
            <Bar 
              data={complaintsChartData} 
              options={{ 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { color: 'gray' } }, y: { ticks: { color: 'gray' } } }
              }} 
            />
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Today's Attendance</h3>
          <div className="h-48 flex items-center justify-center">
            <Doughnut 
              data={attendanceChartData} 
              options={{ 
                maintainAspectRatio: false, 
                plugins: { legend: { labels: { color: 'white' } } } 
              }} 
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Link to="/admin/HostelAllotment" className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 p-4 rounded-xl text-center transition-all">
            <div className="text-2xl mb-2">🏠</div>
            <div className="text-sm text-white">Allotment</div>
          </Link>
          <Link to="/admin/attendance" className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 p-4 rounded-xl text-center transition-all">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm text-white">Attendance</div>
          </Link>
          <Link to="/admin/complaint" className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 p-4 rounded-xl text-center transition-all">
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm text-white">Complaints</div>
          </Link>
          <Link to="/admin/night-out" className="bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 p-4 rounded-xl text-center transition-all">
            <div className="text-2xl mb-2">🌙</div>
            <div className="text-sm text-white">Night Out</div>
          </Link>
          <Link to="/admin/maintenance" className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 p-4 rounded-xl text-center transition-all">
            <div className="text-2xl mb-2">🔧</div>
            <div className="text-sm text-white">Maintenance</div>
          </Link>
          <Link to="/admin/dues" className="bg-indigo-700/20 hover:bg-indigo-700/30 border border-indigo-500/30 p-4 rounded-xl text-center transition-all">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm text-white">Dues</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

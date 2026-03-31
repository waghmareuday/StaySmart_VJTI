import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

function HostelAllotment() {
  const [activeTab, setActiveTab] = useState('engine'); // 'engine', 'list', 'applicants', 'manage'
  
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [activeAlgo, setActiveAlgo] = useState(null);

  const [masterList, setMasterList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [applicantsList, setApplicantsList] = useState([]);
  const [applicantSearch, setApplicantSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Student Management state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [manageSearch, setManageSearch] = useState('');

  // --- FETCHERS ---
  const fetchMasterList = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_MASTER_LIST);
      setMasterList(response.data.rooms || response.data);
    } catch (error) {
      console.error("Failed to fetch list", error);
    }
  };

  const fetchApplicants = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_APPLICATIONS);
      setApplicantsList(response.data.applications || response.data);
    } catch (error) {
      console.error("Failed to fetch applicants", error);
    }
  };

  const fetchAvailableRooms = async (gender) => {
    try {
      const url = gender ? `${API_ENDPOINTS.GET_AVAILABLE_ROOMS}?gender=${gender}` : API_ENDPOINTS.GET_AVAILABLE_ROOMS;
      const response = await axios.get(url);
      setAvailableRooms(response.data.rooms || []);
    } catch (error) {
      console.error("Failed to fetch rooms", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') fetchMasterList();
    if (activeTab === 'applicants' || activeTab === 'manage') fetchApplicants();
  }, [activeTab]);

  // Fetch rooms when student is selected for manual allotment
  useEffect(() => {
    if (selectedStudent && selectedStudent.status !== 'ALLOTTED') {
      fetchAvailableRooms(selectedStudent.gender);
    }
  }, [selectedStudent]);

  // --- ENGINE FUNCTIONS ---
  const handleGeneratePreview = async (algoType) => {
    setLoading(true);
    setActiveAlgo(algoType);
    try {
      const endpoint = algoType === 'FY' ? `${API_ENDPOINTS.ALLOCATE_FY}?preview=true` : `${API_ENDPOINTS.ALLOCATE_SENIORS}?preview=true`;
      const response = await axios.post(endpoint);
      setPreviewData(response.data);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert(`Error generating preview: ${error.response?.data?.error || error.message}`);
      setPreviewData(null);
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!window.confirm("WARNING: This will finalize the allotment in the database. Continue?")) return;
    setLoading(true);
    try {
      const endpoint = activeAlgo === 'FY' ? API_ENDPOINTS.ALLOCATE_FY : API_ENDPOINTS.ALLOCATE_SENIORS;
      const response = await axios.post(endpoint);
      alert(`✅ Success: ${response.data.message}`);
      setPreviewData(null);
      setActiveAlgo(null);
    } catch (error) {
      alert(`Error publishing data: ${error.message}`);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Room Number,Block,Floor,Gender,Occupant 1,Occupant 2,Occupant 3\n";
    masterList.forEach(room => {
      csvContent += `${room.roomNumber},${room.block},${room.floor},${room.gender},${room.occupants[0]||''},${room.occupants[1]||''},${room.occupants[2]||''}\n`;
    });
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "StaySmart_Master_Allotment.csv";
    link.click();
  };

  // --- FILTERS ---
  const filteredMasterList = masterList.filter(room => 
    room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.occupants.some(occ => occ.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredApplicants = applicantsList.filter(app => {
    const matchesSearch = app.studentId.toLowerCase().includes(applicantSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- Reset Academic Year Handler ---
  const handleResetYear = async () => {
    const confirm1 = window.confirm("🚨 DANGER: Are you absolutely sure? This will delete ALL applications and vacate ALL rooms.");
    if (!confirm1) return;

    const confirm2 = window.prompt("Type 'RESET' to confirm you want to wipe the hostel data.");
    if (confirm2 !== 'RESET') {
      alert("Reset cancelled.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.RESET_YEAR);
      alert(`✅ ${response.data.message}`);
      // Refresh the UI lists
      setMasterList([]);
      setApplicantsList([]);
    } catch (error) {
      alert(`Error resetting year: ${error.message}`);
    }
    setLoading(false);
  };

  // --- Seed Rooms Handler (Initialize hostel rooms) ---
  const handleSeedRooms = async () => {
    if (!window.confirm("This will initialize all hostel rooms (C-Block, PG/T-Block, A-Block). Existing rooms will be replaced. Continue?")) return;
    
    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.SEED_ROOMS);
      alert(`✅ ${response.data.message}\nTotal rooms created: ${response.data.totalRooms}`);
      fetchMasterList();
    } catch (error) {
      alert(`Error seeding rooms: ${error.response?.data?.error || error.message}`);
    }
    setLoading(false);
  };

  // --- Seed Sample Applications (for testing) ---
  const handleSeedApplications = async () => {
    if (!window.confirm("This will create 50 test applications. Existing applications will be deleted. Continue?")) return;
    
    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.SEED_APPLICATIONS);
      alert(`✅ ${response.data.message}\nTotal applications: ${response.data.total}`);
      fetchApplicants();
    } catch (error) {
      alert(`Error seeding applications: ${error.response?.data?.error || error.message}`);
    }
    setLoading(false);
  };

  // --- Manual Allotment Handler ---
  const handleManualAllot = async () => {
    if (!selectedStudent || !selectedRoom) {
      alert("Please select a student and a room");
      return;
    }

    if (!window.confirm(`Allot ${selectedStudent.studentId} to room ${availableRooms.find(r => r._id === selectedRoom)?.roomNumber}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.MANUAL_ALLOT, {
        studentId: selectedStudent.studentId,
        roomId: selectedRoom
      });
      alert(`✅ ${response.data.message}`);
      setSelectedStudent(null);
      setSelectedRoom('');
      fetchApplicants();
    } catch (error) {
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    }
    setLoading(false);
  };

  // --- Cancel Allotment Handler ---
  const handleCancelAllotment = async (studentId) => {
    if (!window.confirm(`Cancel room allotment for ${studentId}? They will be moved back to the waiting pool.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.CANCEL_ALLOTMENT, { studentId });
      alert(`✅ ${response.data.message}`);
      setSelectedStudent(null);
      fetchApplicants();
    } catch (error) {
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    }
    setLoading(false);
  };

  // Students for management tab (filtered)
  const managedStudents = applicantsList.filter(app => 
    app.studentId.toLowerCase().includes(manageSearch.toLowerCase())
  );

  return (
    <div className="bg-gray-900 min-h-screen p-8 text-gray-300">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Hostel Allotment Management</h1>
            <p className="text-gray-400">Run algorithms, view applicants, or manage the master list.</p>
          </div>
          
          {/* TABS */}
          <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700 shadow-lg flex-wrap">
            <button 
              onClick={() => setActiveTab('engine')}
              className={`px-5 py-2 rounded-md font-medium transition ${activeTab === 'engine' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Allotment Engine
            </button>
            <button 
              onClick={() => setActiveTab('manage')}
              className={`px-5 py-2 rounded-md font-medium transition ${activeTab === 'manage' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Student Management
            </button>
            <button 
              onClick={() => setActiveTab('applicants')}
              className={`px-5 py-2 rounded-md font-medium transition ${activeTab === 'applicants' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Applicants Database
            </button>
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-5 py-2 rounded-md font-medium transition ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Master Room List
            </button>
          </div>
        </div>

        {/* ======================= ENGINE TAB ======================= */}
        {activeTab === 'engine' && (
          <div>
             {!previewData ? (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                  <h3 className="text-xl font-bold text-blue-400 mb-2">FY Allotment</h3>
                  <p className="text-sm text-gray-400 mb-6">Runs MHT-CET sorting algorithm for First Year students.</p>
                  <button onClick={() => handleGeneratePreview('FY')} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    {loading ? 'Processing...' : 'Generate FY Preview'}
                  </button>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                  <h3 className="text-xl font-bold text-green-400 mb-2">Senior Allotment</h3>
                  <p className="text-sm text-gray-400 mb-6">Processes roommate handshake logic for SY/TY/BTech.</p>
                  <button onClick={() => handleGeneratePreview('Senior')} disabled={loading} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    {loading ? 'Processing...' : 'Generate Senior Preview'}
                  </button>
                </div>
              </div>
              
              {/* Setup Section */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8">
                <h3 className="text-lg font-bold text-gray-300 mb-4">Database Setup</h3>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={handleSeedRooms} 
                    disabled={loading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Initialize Hostel Rooms'}
                  </button>
                  <button 
                    onClick={handleSeedApplications} 
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Seed 50 Test Applications'}
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-3">
                  Use "Initialize Hostel Rooms" to create C-Block (FY Boys), PG/T-Block (Senior Boys), and A-Block (Girls) rooms. 
                  "Seed 50 Test Applications" creates 50 student records for allotment testing.
                </p>
              </div>
              </>
            ) : (
              <div className="bg-gray-800 rounded-xl border border-yellow-500/50 p-6 shadow-2xl max-h-[800px] flex flex-col">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <div>
                    <h2 className="text-2xl font-bold text-yellow-400">Draft Preview: {activeAlgo}</h2>
                    <p className="text-gray-400 text-sm">Review the allocations before publishing to database</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        let csv = "data:text/csv;charset=utf-8,Student ID,Gender,Rank,Room,Requested Partner\n";
                        previewData.previewList?.forEach(item => {
                          csv += `${item.studentId},${item.gender},${item.rank || '-'},${item.room},${item.partnerRequested || '-'}\n`;
                        });
                        const link = document.createElement("a");
                        link.href = encodeURI(csv);
                        link.download = `Draft_${activeAlgo}_Allotment.csv`;
                        link.click();
                      }}
                      className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                    >
                      Download Draft
                    </button>
                    <button onClick={() => setPreviewData(null)} className="px-4 py-2 bg-red-900/50 text-red-400 rounded hover:bg-red-900 transition">Discard</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
                   <div className="bg-gray-900 p-4 rounded-lg text-center border border-gray-700">
                     <p className="text-gray-400 text-sm">Total Processed</p>
                     <p className="text-2xl font-bold text-white">{previewData.stats?.totalApplicants || 0}</p>
                   </div>
                   <div className="bg-blue-900/20 p-4 rounded-lg text-center border border-blue-800">
                     <p className="text-blue-400 text-sm">Successfully Allotted</p>
                     <p className="text-2xl font-bold text-blue-400">{previewData.stats?.allottedCount || 0}</p>
                   </div>
                   <div className="bg-red-900/20 p-4 rounded-lg text-center border border-red-800">
                     <p className="text-red-400 text-sm">Unallotted</p>
                     <p className="text-2xl font-bold text-red-400">{previewData.stats?.unallottedCount || 0}</p>
                   </div>
                </div>

                {/* Pairing Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
                   <div className="bg-green-900/20 p-3 rounded-lg text-center border border-green-800">
                     <p className="text-green-400 text-xs">Mutual Pairs</p>
                     <p className="text-xl font-bold text-green-400">{previewData.stats?.mutualPairs || 0}</p>
                   </div>
                   <div className="bg-yellow-900/20 p-3 rounded-lg text-center border border-yellow-800">
                     <p className="text-yellow-400 text-xs">One-Sided Pairs</p>
                     <p className="text-xl font-bold text-yellow-400">{previewData.stats?.oneSidedPairs || 0}</p>
                   </div>
                   <div className="bg-purple-900/20 p-3 rounded-lg text-center border border-purple-800">
                     <p className="text-purple-400 text-xs">Random Pairs</p>
                     <p className="text-xl font-bold text-purple-400">{Math.round(previewData.stats?.randomPairs || 0)}</p>
                   </div>
                </div>
                
                {/* Preview Table */}
                {previewData.previewList && previewData.previewList.length > 0 && (
                  <div className="overflow-y-auto border border-gray-700 rounded-lg mb-4 flex-1 max-h-[350px]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-900 text-gray-400 sticky top-0">
                        <tr>
                          <th className="p-3">Student ID</th>
                          <th className="p-3">Gender</th>
                          <th className="p-3">Requested</th>
                          <th className="p-3">Match</th>
                          <th className="p-3">Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.previewList.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="p-3 font-bold text-white">{item.studentId}</td>
                            <td className="p-3 text-gray-400">{item.gender === 'M' ? 'Male' : 'Female'}</td>
                            <td className="p-3 text-gray-400">{item.partnerRequested || '-'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold
                                ${item.matchType === 'mutual' ? 'bg-green-500/20 text-green-400' : ''}
                                ${item.matchType === 'one-sided' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                ${item.matchType === 'random' ? 'bg-purple-500/20 text-purple-400' : ''}
                              `}>
                                {item.matchType}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-yellow-400">{item.room}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Warnings */}
                {previewData.warnings && previewData.warnings.length > 0 && (
                  <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-3 mb-4 shrink-0">
                    {previewData.warnings.map((w, idx) => (
                      <p key={idx} className="text-orange-400 text-sm">{w}</p>
                    ))}
                  </div>
                )}
                
                <button onClick={handlePublish} disabled={loading} className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg transition shadow-lg shrink-0">
                  {loading ? 'Publishing...' : 'Confirm & Publish to Database'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================= STUDENT MANAGEMENT TAB ======================= */}
        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Student List */}
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                <h3 className="text-lg font-bold text-white mb-3">Select Student</h3>
                <input 
                  type="text"
                  placeholder="Search by Student ID..."
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-lg focus:ring-blue-500 outline-none text-white border border-gray-700"
                />
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {managedStudents.length > 0 ? managedStudents.map((student) => (
                  <div 
                    key={student._id}
                    onClick={() => setSelectedStudent(student)}
                    className={`p-4 border-b border-gray-700 cursor-pointer transition ${
                      selectedStudent?._id === student._id ? 'bg-blue-900/30 border-l-4 border-l-blue-500' : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{student.studentId}</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold
                        ${student.status === 'ALLOTTED' ? 'bg-green-500/20 text-green-400' : ''}
                        ${student.status === 'READY_FOR_ALLOTMENT' ? 'bg-blue-500/20 text-blue-400' : ''}
                        ${student.status === 'WAITING_FOR_PARTNER' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                        ${student.status === 'REJECTED_DISTANCE' ? 'bg-red-500/20 text-red-400' : ''}
                      `}>
                        {student.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {student.academicYear} | {student.gender === 'M' ? 'Male' : 'Female'}
                      {student.allottedRoom && ` | Room: ${student.allottedRoom.roomNumber}`}
                    </p>
                  </div>
                )) : (
                  <div className="p-8 text-center text-gray-500">
                    No students found. Click "Seed Test Applications" in the Engine tab first.
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Actions */}
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
              {selectedStudent ? (
                <>
                  <h3 className="text-xl font-bold text-white mb-4">
                    Managing: {selectedStudent.studentId}
                  </h3>
                  
                  <div className="bg-gray-900 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Academic Year:</span>
                        <span className="ml-2 text-white">{selectedStudent.academicYear}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Gender:</span>
                        <span className="ml-2 text-white">{selectedStudent.gender === 'M' ? 'Male' : 'Female'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className="ml-2 text-white">{selectedStudent.status.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Current Room:</span>
                        <span className="ml-2 text-white">{selectedStudent.allottedRoom?.roomNumber || 'None'}</span>
                      </div>
                      {selectedStudent.requestedRoommateId && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Requested Roommate:</span>
                          <span className="ml-2 text-white">{selectedStudent.requestedRoommateId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions based on status */}
                  {selectedStudent.status === 'ALLOTTED' ? (
                    <div>
                      <p className="text-gray-400 mb-4">
                        This student is currently allotted to <span className="text-green-400 font-bold">{selectedStudent.allottedRoom?.roomNumber}</span>.
                      </p>
                      <button
                        onClick={() => handleCancelAllotment(selectedStudent.studentId)}
                        disabled={loading}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition"
                      >
                        {loading ? 'Processing...' : 'Cancel Allotment'}
                      </button>
                      <p className="text-gray-500 text-xs mt-2">
                        This will remove them from their room and put them back in the waiting pool.
                      </p>
                    </div>
                  ) : selectedStudent.status === 'READY_FOR_ALLOTMENT' || selectedStudent.status === 'WAITING_FOR_PARTNER' ? (
                    <div>
                      <p className="text-gray-400 mb-4">Manually assign this student to a room:</p>
                      <select
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        className="w-full p-3 bg-gray-900 rounded-lg text-white border border-gray-700 mb-4"
                      >
                        <option value="">-- Select a Room --</option>
                        {availableRooms.map(room => (
                          <option key={room._id} value={room._id}>
                            {room.roomNumber} ({room.block}) - {room.availableSlots} slot(s) available
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleManualAllot}
                        disabled={loading || !selectedRoom}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Allot to Selected Room'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                      <p className="text-red-400">
                        This student has status "{selectedStudent.status}" and cannot be manually allotted.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p>Select a student from the list to manage their allotment</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= APPLICANTS TAB ======================= */}
        {activeTab === 'applicants' && (
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex gap-4 items-center bg-gray-800/50">
              <input 
                type="text"
                placeholder="Search Student ID..."
                value={applicantSearch}
                onChange={(e) => setApplicantSearch(e.target.value)}
                className="flex-1 p-3 bg-gray-900 rounded-lg focus:ring-blue-500 outline-none text-white border border-gray-700"
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-3 bg-gray-900 rounded-lg focus:ring-blue-500 outline-none text-white border border-gray-700 w-64"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="READY_FOR_ALLOTMENT">Ready for Allotment</option>
                <option value="WAITING_FOR_PARTNER">Waiting for Partner</option>
                <option value="ALLOTTED">Allotted</option>
                <option value="REJECTED_DISTANCE">Rejected (Distance)</option>
              </select>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400 border-b border-gray-700 sticky top-0 shadow-sm">
                  <tr>
                    <th className="p-4">Student ID</th>
                    <th className="p-4">Year/Gender</th>
                    <th className="p-4">CET Rank</th>
                    <th className="p-4">Requested Roommate</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Assigned Room</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.length > 0 ? filteredApplicants.map((app) => (
                    <tr key={app._id} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                      <td className="p-4 font-bold text-white">{app.studentId}</td>
                      <td className="p-4 text-gray-300">{app.academicYear} / {app.gender}</td>
                      <td className="p-4 text-gray-300">{app.mhtCetRank || '-'}</td>
                      <td className="p-4 text-gray-300">{app.requestedRoommateId || '-'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold
                          ${app.status === 'REJECTED_DISTANCE' ? 'bg-red-500/20 text-red-400' : ''}
                          ${app.status === 'WAITING_FOR_PARTNER' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                          ${app.status === 'READY_FOR_ALLOTMENT' ? 'bg-blue-500/20 text-blue-400' : ''}
                          ${app.status === 'ALLOTTED' ? 'bg-green-500/20 text-green-400' : ''}
                          ${app.status === 'PENDING' ? 'bg-gray-600 text-gray-200' : ''}
                        `}>
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-green-400">
                        {app.allottedRoom ? app.allottedRoom.roomNumber : '-'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">No applicants found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-900 border-t border-gray-700 text-sm text-gray-400">
              Total Applicants Showing: {filteredApplicants.length}
            </div>
          </div>
        )}

        {/* ======================= MASTER LIST TAB ======================= */}
        {activeTab === 'list' && (
           <div className="flex flex-col gap-6">
             {/* The Master List Table (Keep your existing table code here) */}
             <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
               <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                 <input 
                   type="text"
                   placeholder="Search Room Number or Student ID..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-1/2 p-3 bg-gray-900 rounded-lg focus:ring-blue-500 outline-none text-white border border-gray-700"
                 />
                 <button onClick={handleExportCSV} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-md">
                   Export to CSV
                 </button>
               </div>
   
               <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gray-900 text-gray-400 border-b border-gray-700 sticky top-0 shadow-sm">
                     <tr>
                       <th className="p-4">Room Number</th>
                       <th className="p-4">Block</th>
                       <th className="p-4">Occupant 1</th>
                       <th className="p-4">Occupant 2</th>
                       <th className="p-4">Occupant 3 (C Block)</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredMasterList.length > 0 ? filteredMasterList.map((room) => (
                       <tr key={room._id} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                         <td className="p-4 font-bold text-blue-400">{room.roomNumber}</td>
                         <td className="p-4">{room.block}</td>
                         <td className="p-4 text-white">{room.occupants[0] || '-'}</td>
                         <td className="p-4 text-white">{room.occupants[1] || '-'}</td>
                         <td className="p-4 text-white">{room.occupants[2] || '-'}</td>
                       </tr>
                     )) : (
                       <tr>
                         <td colSpan="5" className="p-8 text-center text-gray-500">No allotted rooms found matching your search.</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>

             {/* --- NEW: DANGER ZONE --- */}
             <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 flex justify-between items-center shadow-lg">
               <div>
                 <h3 className="text-red-400 font-bold text-xl mb-1">End of Academic Year (Danger Zone)</h3>
                 <p className="text-gray-400 text-sm">
                   This action will permanently delete all student applications and vacate every room in the database. <br/>
                   <span className="font-bold text-gray-300">Please Export to CSV before doing this.</span>
                 </p>
               </div>
               <button 
                 onClick={handleResetYear}
                 disabled={loading}
                 className="px-6 py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-600 transition shadow-md whitespace-nowrap"
               >
                 {loading ? 'Processing...' : 'Vacate All Rooms & Reset'}
               </button>
             </div>
           </div>
        )}

      </div>
    </div>
  );
}

export default HostelAllotment;
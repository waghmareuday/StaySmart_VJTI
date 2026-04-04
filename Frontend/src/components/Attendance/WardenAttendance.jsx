import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import myHook from '../Context';

/**
 * Mobile-First Warden Attendance UI
 * Exception-Based Marking - Only absent students get stored
 * Uses unified login system
 */
function WardenAttendance() {
  const navigate = useNavigate();
  const { logout } = myHook();
  
  // Warden auth state
  const [warden, setWarden] = useState(null);
  const [wardenToken, setWardenToken] = useState('');
  const [managedBlocks, setManagedBlocks] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Attendance state
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [roomsData, setRoomsData] = useState(null);
  const [currentFloor, setCurrentFloor] = useState(null);
  const [absentStudents, setAbsentStudents] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [error, setError] = useState(null);

  // Check for warden session from unified login
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('wardenToken');

    if (savedUser && savedToken) {
      const user = JSON.parse(savedUser);
      if (user.isWarden || user.role === 'warden') {
        setWarden(user);
        setWardenToken(savedToken);
        setManagedBlocks(Array.isArray(user.managedBlocks) ? user.managedBlocks : []);
      }
    }
    setAuthChecked(true);
  }, []);

  // Redirect to login if not authenticated as warden
  useEffect(() => {
    if (authChecked && !warden) {
      navigate('/Login', { state: { message: 'Please login as warden to access attendance' } });
    }
  }, [authChecked, warden, navigate]);

  // Fetch blocks when warden is logged in
  useEffect(() => {
    if (warden && wardenToken) {
      fetchBlocks();
    }
  }, [warden, wardenToken]);

  const handleWardenLogout = () => {
    setWarden(null);
    setWardenToken('');
    logout();
    navigate('/Login');
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${wardenToken}`
  });

  const canAccessBlock = (blockCode) => {
    const normalized = String(blockCode || '').toUpperCase();
    if (managedBlocks.length > 0) {
      return managedBlocks.includes(normalized);
    }

    const assignedBlock = String(warden?.assignedBlock || '').toUpperCase();
    if (assignedBlock === 'ALL') return true;
    if (assignedBlock === 'PG') return normalized === 'C' || normalized === 'PG';
    return normalized === assignedBlock;
  };

  const fetchBlocks = async () => {
    setError(null);
    try {
      const res = await fetch(api.API_ENDPOINTS.ATTENDANCE_BLOCKS, {
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        setError(data.message || 'Session expired. Please login again.');
        handleWardenLogout();
        return;
      }

      if (data.success) {
        setBlocks(data.blocks);
        if (Array.isArray(data.managedBlocks)) {
          setManagedBlocks(data.managedBlocks.map((b) => String(b).toUpperCase()));
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setError('Failed to load blocks. Is the server running?');
    }
  };

  const selectBlock = async (block) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(api.API_ENDPOINTS.ATTENDANCE_ROOMS(block), {
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        setError(data.message || 'Unauthorized access');
        setLoading(false);
        return;
      }
      
      if (data.success) {
        setRoomsData(data);
        setSelectedBlock(block);
        if (Array.isArray(data.managedBlocks)) {
          setManagedBlocks(data.managedBlocks.map((b) => String(b).toUpperCase()));
        }
        // Set current floor to first floor
        const floors = Object.keys(data.byFloor || {}).sort((a, b) => a - b);
        setCurrentFloor(floors[0] || '0');
        setAbsentStudents(new Set());
        setSubmitted(false);
        
        // Check if no students
        if (data.totalStudents === 0) {
          setError(`No students allotted in Block ${block} yet.`);
        }
      } else {
        setError(data.message || 'Failed to load rooms');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load rooms. Please try again.');
    }
    setLoading(false);
  };

  const toggleAbsent = (studentId, canMarkAbsent) => {
    if (!canMarkAbsent) return;
    
    const newSet = new Set(absentStudents);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setAbsentStudents(newSet);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const absentList = [];
      roomsData.rooms.forEach(room => {
        room.students.forEach(student => {
          if (absentStudents.has(student.studentId)) {
            absentList.push({
              studentId: student.studentId,
              name: student.name,
              email: student.email,
              roomNumber: room.roomNumber,
              floor: room.floor
            });
          }
        });
      });

      const res = await fetch(api.API_ENDPOINTS.ATTENDANCE_SUBMIT, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          block: selectedBlock,
          absentStudents: absentList,
          checkTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setSubmitResult(data);
      } else {
        alert(data.message || 'Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert('Failed to submit attendance');
    }
    setSubmitting(false);
  };

  const resetAndGoBack = () => {
    setSelectedBlock(null);
    setRoomsData(null);
    setAbsentStudents(new Set());
    setSubmitted(false);
    setSubmitResult(null);
    setError(null);
  };

  // ==================== AUTH CHECK LOADING ====================
  if (!authChecked || !warden) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // ==================== BLOCK SELECTION SCREEN ====================
  if (!selectedBlock) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-md mx-auto">
          {/* Header with logout */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">🏠 Hostel Attendance</h1>
              <p className="text-sm text-gray-400">Hello, {warden.name}</p>
            </div>
            <button
              onClick={handleWardenLogout}
              className="text-sm bg-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/30"
            >
              Logout
            </button>
          </div>

          {/* Warden Info Badge */}
          <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400">👤</span>
              <span className="text-sm">
                {warden.role === 'CHIEF_WARDEN' ? 'Chief Warden' : 'Block Warden'}
                {managedBlocks.length > 0 && ` - Blocks ${managedBlocks.join(', ')}`}
              </span>
            </div>
          </div>

          <p className="text-gray-400 text-center mb-4 text-sm">Select a block to take attendance</p>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {blocks.map(block => (
              <button
                key={block.block}
                onClick={() => selectBlock(block.block)}
                disabled={!canAccessBlock(block.block)}
                className={`w-full rounded-xl p-4 flex items-center justify-between transition-all ${
                  !canAccessBlock(block.block)
                    ? 'bg-gray-800/50 opacity-50 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700 active:scale-98'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${
                    block.studentCount > 0 ? 'bg-indigo-600' : 'bg-gray-600'
                  }`}>
                    {block.block}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Block {block.block}</div>
                    <div className="text-sm text-gray-400">
                      {block.roomCount > 0 ? `${block.roomCount} occupied rooms` : 'No rooms occupied'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${block.studentCount > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                    {block.studentCount}
                  </div>
                  <div className="text-xs text-gray-400">students</div>
                </div>
              </button>
            ))}
          </div>

          {blocks.length === 0 && !error && (
            <div className="text-center text-gray-400 py-12">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p>Loading blocks...</p>
            </div>
          )}

          <button
            onClick={fetchBlocks}
            className="mt-6 w-full bg-gray-800 hover:bg-gray-700 text-gray-400 py-2 rounded-lg text-sm"
          >
            🔄 Refresh Blocks
          </button>
        </div>
      </div>
    );
  }

  // ==================== SUBMITTED SUCCESS SCREEN ====================
  if (submitted && submitResult) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-md mx-auto pt-10">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-400">Attendance Submitted!</h2>
            <p className="text-gray-400 mt-2">Block {selectedBlock} • {submitResult.date}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
              <div className="bg-red-500/20 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-400">{submitResult.absencesRecorded}</div>
                <div className="text-xs text-gray-400">Absent</div>
              </div>
              <div className="bg-green-500/20 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">
                  {(roomsData?.totalStudents || 0) - submitResult.absencesRecorded}
                </div>
                <div className="text-xs text-gray-400">Present</div>
              </div>
            </div>

            {submitResult.escalationSummary && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Escalation Summary:</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-yellow-400">⚠️ Strike 1: {submitResult.escalationSummary.strike1}</span>
                  <span className="text-red-400">🚨 Strike 2: {submitResult.escalationSummary.strike2}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={resetAndGoBack}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold transition-all"
          >
            ← Back to Blocks
          </button>
        </div>
      </div>
    );
  }

  // ==================== LOADING SCREEN ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Loading Block {selectedBlock}...</p>
        </div>
      </div>
    );
  }

  // ==================== NO STUDENTS SCREEN ====================
  if (roomsData && roomsData.totalStudents === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-md mx-auto pt-10">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-400">No Students in Block {selectedBlock}</h2>
            <p className="text-gray-500 mt-2">This block has no allotted students yet.</p>
          </div>

          <button
            onClick={resetAndGoBack}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold transition-all"
          >
            ← Back to Blocks
          </button>
        </div>
      </div>
    );
  }

  // ==================== MAIN ATTENDANCE UI ====================
  const floors = Object.keys(roomsData?.byFloor || {}).sort((a, b) => a - b);
  const currentFloorRooms = roomsData?.byFloor?.[currentFloor] || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24">
      {/* Fixed Header */}
      <div className="sticky top-0 bg-gray-900 z-10 p-4 border-b border-gray-700">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={resetAndGoBack}
              className="text-indigo-400 flex items-center gap-1"
            >
              ← Blocks
            </button>
            <div className="text-center">
              <div className="font-bold">Block {selectedBlock}</div>
              <div className="text-xs text-gray-400">{roomsData?.date}</div>
            </div>
            <div className="text-right">
              <div className="text-red-400 font-bold">{absentStudents.size}</div>
              <div className="text-xs text-gray-400">absent</div>
            </div>
          </div>

          {/* Floor Tabs */}
          {floors.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {floors.map(floor => (
                <button
                  key={floor}
                  onClick={() => setCurrentFloor(floor)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    currentFloor === floor
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  Floor {floor}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-lg mx-auto px-4 py-2">
        <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3 text-sm">
          <span className="text-green-400">●</span>
          <span className="text-gray-300">Tap student name to mark <span className="text-red-400 font-semibold">ABSENT</span></span>
        </div>
      </div>

      {/* On Leave Count */}
      {roomsData?.studentsOnLeave > 0 && (
        <div className="max-w-lg mx-auto px-4 py-1">
          <div className="bg-indigo-500/20 rounded-lg p-2 text-center text-sm">
            <span className="text-indigo-400">🎫 {roomsData.studentsOnLeave} students on approved leave (auto-excused)</span>
          </div>
        </div>
      )}

      {/* Room Cards */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {currentFloorRooms.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>No rooms on this floor</p>
          </div>
        ) : (
          currentFloorRooms.map(room => (
            <div 
              key={`${room.block}-${room.roomNumber}`}
              className="bg-gray-800 rounded-xl overflow-hidden"
            >
              {/* Room Header */}
              <button
                onClick={() => setExpandedRoom(expandedRoom === room.roomNumber ? null : room.roomNumber)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center font-bold">
                    {room.roomNumber}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Room {room.roomNumber}</div>
                    <div className="text-xs text-gray-400">{room.students.length} / {room.capacity} students</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {room.students.some(s => absentStudents.has(s.studentId)) && (
                    <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">
                      {room.students.filter(s => absentStudents.has(s.studentId)).length} absent
                    </span>
                  )}
                  <span className={`transform transition-transform ${expandedRoom === room.roomNumber ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </button>

              {/* Students List (Expanded) */}
              {(expandedRoom === room.roomNumber || room.students.length <= 2) && (
                <div className="border-t border-gray-700">
                  {room.students.map(student => {
                    const isAbsent = absentStudents.has(student.studentId);
                    const isOnLeave = student.status === 'ON_APPROVED_LEAVE';

                    return (
                      <button
                        key={student.studentId}
                        onClick={() => toggleAbsent(student.studentId, student.canMarkAbsent)}
                        disabled={!student.canMarkAbsent}
                        className={`w-full p-4 flex items-center justify-between border-b border-gray-700 last:border-0 transition-all ${
                          isOnLeave 
                            ? 'bg-indigo-500/10 cursor-not-allowed' 
                            : isAbsent 
                              ? 'bg-red-500/20' 
                              : 'hover:bg-gray-700 active:bg-green-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            isOnLeave 
                              ? 'bg-indigo-500/30 text-indigo-400' 
                              : isAbsent 
                                ? 'bg-red-500 text-white' 
                                : 'bg-green-500/30 text-green-400'
                          }`}>
                            {isOnLeave ? '🎫' : isAbsent ? '✗' : '✓'}
                          </div>
                          <div className="text-left">
                            <div className={`font-medium ${isAbsent ? 'text-red-400' : ''}`}>
                              {student.name}
                            </div>
                            <div className="text-xs text-gray-400">{student.studentId}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          {isOnLeave ? (
                            <div className="text-xs text-indigo-400">
                              <div>On Leave</div>
                              <div className="text-gray-500">{student.leaveDetails?.type}</div>
                            </div>
                          ) : isAbsent ? (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                              ABSENT
                            </span>
                          ) : (
                            <span className="text-green-400 text-sm">Present</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Fixed Bottom Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-lg mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-400">✓ {(roomsData?.totalStudents || 0) - absentStudents.size - (roomsData?.studentsOnLeave || 0)}</span>
              <span className="text-indigo-400">🎫 {roomsData?.studentsOnLeave || 0}</span>
              <span className="text-red-400">✗ {absentStudents.size}</span>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              absentStudents.size === 0
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } ${submitting ? 'opacity-50' : ''}`}
          >
            {submitting ? 'Submitting...' : absentStudents.size === 0 ? 'All Present ✓' : `Submit (${absentStudents.size} Absent)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WardenAttendance;

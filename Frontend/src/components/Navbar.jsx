import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaChevronDown, FaTimes } from "react-icons/fa";
import { LuCircleUser, LuLogOut } from "react-icons/lu";
import myHook from "./Context";

function Navbar() {
  const [isHostelDropdownVisible, setHostelDropdownVisible] = useState(false);
  const [isMessDropdownVisible, setMessDropdownVisible] = useState(false);
  const [isUserDropdownVisible, setUserDropdownVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = myHook();
  const navigate = useNavigate();

  const isAdminUser = typeof isAdmin === "function" ? isAdmin() : false;
  const isWarden = user?.role === "warden" || user?.isWarden === true;
  const isStudent = !!user && !isAdminUser && !isWarden;

  const closeMenus = () => {
    setHostelDropdownVisible(false);
    setMessDropdownVisible(false);
    setUserDropdownVisible(false);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setHostelDropdownVisible(false);
        setMessDropdownVisible(false);
        setUserDropdownVisible(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    closeMenus();
    navigate("/");
  };

  const getRoleBadge = () => {
    if (isAdminUser) return { text: "Admin", color: "bg-indigo-600" };
    if (isWarden) return { text: "Rector", color: "bg-indigo-500" };
    return { text: "Student", color: "bg-blue-600" };
  };

  const studentHostelLinks = [
    { to: "/RoomAllotment", label: "Room Allotment" },
    { to: "/RoomSwap", label: "Room Swap" },
    { to: "/Maintenance", label: "Maintenance" },
    { to: "/NightOutPass", label: "Night Out Pass" },
    { to: "/Dues", label: "Dues & Payments" },
    { to: "/LostnFound", label: "Lost & Found" },
    { to: "/HostelFeedback", label: "Hostel Feedback" },
    { to: "/HostelLeavingForm", label: "Hostel Leaving" }
  ];

  const studentMessLinks = [
    { to: "/MessBill", label: "Mess Bill" },
    { to: "/MessFeedback", label: "Mess Feedback" },
    { to: "/MessOff", label: "Mess Off" }
  ];

  const wardenOperations = [
    { to: "/Attendance", label: "Take Attendance" },
    { to: "/Warden/NightOut", label: "Night Out Passes" }
  ];

  return (
    <header className="h-20 w-full bg-gray-900 border-b border-gray-700 fixed top-0 z-50 px-3 sm:px-4 md:px-8 flex items-center justify-between gap-3">
      <Link to="/" className="text-white font-bold text-lg sm:text-xl md:text-2xl flex items-center gap-2 min-w-0">
        <span className="shrink-0">🏠</span>
        <span className="hidden sm:inline truncate">VJTI StaySmart</span>
      </Link>

      <div className="hidden md:flex items-center gap-3 text-sm text-gray-100">
        <Link to="/" className="px-3 py-2 rounded-lg hover:bg-gray-800">Home</Link>

        {!isWarden && (
          <>
            <div className="relative dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMessDropdownVisible(false);
                  setUserDropdownVisible(false);
                  setHostelDropdownVisible(!isHostelDropdownVisible);
                }}
                className="px-3 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2"
              >
                Hostel <FaChevronDown className="text-xs" />
              </button>

              {isHostelDropdownVisible && (
                <div className="absolute left-0 mt-2 w-56 bg-gray-800 text-gray-100 rounded-lg shadow-lg border border-gray-700 py-1">
                  <Link to="/Event" className="block px-4 py-2 hover:bg-gray-700" onClick={closeMenus}>Events</Link>

                  {isStudent && (
                    <>
                      {studentHostelLinks.map((item) => (
                        <Link key={item.to} to={item.to} className="block px-4 py-2 hover:bg-gray-700" onClick={closeMenus}>
                          {item.label}
                        </Link>
                      ))}
                    </>
                  )}

                  {isAdminUser && (
                    <>
                      <div className="border-t border-gray-700 my-1" />
                      <Link to="/admin/attendance" className="block px-4 py-2 hover:bg-indigo-900/30 text-indigo-300 font-medium" onClick={closeMenus}>
                        Attendance Reports
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHostelDropdownVisible(false);
                  setUserDropdownVisible(false);
                  setMessDropdownVisible(!isMessDropdownVisible);
                }}
                className="px-3 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2"
              >
                Mess <FaChevronDown className="text-xs" />
              </button>

              {isMessDropdownVisible && (
                <div className="absolute left-0 mt-2 w-48 bg-gray-800 text-gray-100 rounded-lg shadow-lg border border-gray-700 py-1">
                  <Link to="/MessSchedule" className="block px-4 py-2 hover:bg-gray-700" onClick={closeMenus}>
                    Schedule & Menu
                  </Link>

                  {isStudent && (
                    <>
                      {studentMessLinks.map((item) => (
                        <Link key={item.to} to={item.to} className="block px-4 py-2 hover:bg-gray-700" onClick={closeMenus}>
                          {item.label}
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {isStudent && (
          <Link to="/Complaint" className="px-3 py-2 rounded-lg hover:bg-gray-800" onClick={closeMenus}>
            Complaint
          </Link>
        )}

        {isWarden && (
          <>
            {wardenOperations.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-medium"
                onClick={closeMenus}
              >
                {item.label}
              </Link>
            ))}
          </>
        )}

        {isAdminUser && (
          <Link to="/admin/dashboard" className="px-3 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 font-medium" onClick={closeMenus}>
            Admin Dashboard
          </Link>
        )}

        {!user ? (
          <>
            <Link to="/Login" className="px-4 py-2 rounded-lg border border-gray-500 hover:bg-gray-800" onClick={closeMenus}>
              Login
            </Link>
            <Link to="/Signup" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700" onClick={closeMenus}>
              Signup
            </Link>
          </>
        ) : (
          <div className="relative dropdown-container">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHostelDropdownVisible(false);
                setMessDropdownVisible(false);
                setUserDropdownVisible(!isUserDropdownVisible);
              }}
              className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-gray-800"
            >
              <LuCircleUser className="text-3xl" />
              <span className="hidden lg:block">{user.name || "User"}</span>
            </button>

            {isUserDropdownVisible && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 text-gray-100 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700 bg-gray-900">
                  <p className="font-semibold truncate">{user.name || "User"}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white ${getRoleBadge().color}`}>
                    {getRoleBadge().text}
                  </span>
                </div>

                {isStudent && (
                  <>
                    <Link to="/Profile" className="block px-4 py-2 hover:bg-gray-700" onClick={closeMenus}>My Profile</Link>
                    <Link to="/student/dashboard" className="block px-4 py-2 hover:bg-gray-700" onClick={closeMenus}>Student Dashboard</Link>
                  </>
                )}

                {isWarden && (
                  <>
                    <Link to="/Attendance" className="block px-4 py-2 hover:bg-gray-700 text-indigo-300 font-medium" onClick={closeMenus}>
                      Rector Attendance
                    </Link>
                    <Link to="/Warden/NightOut" className="block px-4 py-2 hover:bg-gray-700 text-indigo-300 font-medium" onClick={closeMenus}>
                      Night Out Passes
                    </Link>
                  </>
                )}

                {isAdminUser && (
                  <Link to="/admin/dashboard" className="block px-4 py-2 hover:bg-gray-700 text-indigo-300 font-medium" onClick={closeMenus}>
                    Admin Dashboard
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 border-t border-gray-700 hover:bg-red-900/30 text-red-300 flex items-center gap-2"
                >
                  <LuLogOut /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden text-white text-lg p-2 rounded-md hover:bg-gray-800"
      >
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full max-h-[calc(100vh-5rem)] overflow-y-auto bg-gray-900 border-b border-gray-700 px-4 py-4 space-y-2 text-white">
          <Link to="/" className="block px-3 py-2 rounded hover:bg-gray-800" onClick={closeMenus}>Home</Link>

          {!isWarden && (
            <>
              <Link to="/Event" className="block px-3 py-2 rounded hover:bg-gray-800" onClick={closeMenus}>Events</Link>
              <Link to="/MessSchedule" className="block px-3 py-2 rounded hover:bg-gray-800" onClick={closeMenus}>Mess Schedule</Link>
            </>
          )}

          {isStudent && (
            <>
              {studentHostelLinks.map((item) => (
                <Link key={item.to} to={item.to} className="block px-3 py-2 rounded hover:bg-gray-800" onClick={closeMenus}>
                  {item.label}
                </Link>
              ))}
              {studentMessLinks.map((item) => (
                <Link key={item.to} to={item.to} className="block px-3 py-2 rounded hover:bg-gray-800" onClick={closeMenus}>
                  {item.label}
                </Link>
              ))}
              <Link to="/Complaint" className="block px-3 py-2 rounded hover:bg-gray-800" onClick={closeMenus}>Complaint</Link>
              <Link to="/Profile" className="block px-3 py-2 rounded hover:bg-gray-800" onClick={closeMenus}>My Profile</Link>
            </>
          )}

          {isWarden && (
            <>
              <Link to="/Attendance" className="block px-3 py-2 rounded bg-indigo-700 hover:bg-indigo-600" onClick={closeMenus}>
                Take Attendance
              </Link>
              <Link to="/Warden/NightOut" className="block px-3 py-2 rounded bg-indigo-700 hover:bg-indigo-600" onClick={closeMenus}>
                Night Out Passes
              </Link>
            </>
          )}

          {isAdminUser && (
            <>
              <Link to="/admin/dashboard" className="block px-3 py-2 rounded bg-purple-700 hover:bg-purple-600" onClick={closeMenus}>
                Admin Dashboard
              </Link>
              <Link to="/admin/attendance" className="block px-3 py-2 rounded hover:bg-gray-800" onClick={closeMenus}>
                Attendance Reports
              </Link>
            </>
          )}

          {!user ? (
            <div className="pt-2 flex gap-2">
              <Link to="/Login" className="flex-1 text-center px-3 py-2 border border-gray-500 rounded" onClick={closeMenus}>Login</Link>
              <Link to="/Signup" className="flex-1 text-center px-3 py-2 rounded bg-indigo-600 text-white font-medium" onClick={closeMenus}>Signup</Link>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded hover:bg-red-900/30 text-red-300 flex items-center gap-2">
              <LuLogOut /> Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
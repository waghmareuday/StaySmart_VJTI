import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaSun, FaMoon, FaBars, FaTimes } from "react-icons/fa";

function Navbar() {
  const [isHostelDropdownVisible, setHostelDropdownVisible] = useState(false);
  const [isMessDropdownVisible, setMessDropdownVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, []);

  const toggleDropdown = (setter, value) => {
    setter(value);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode);
    if (newDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={`navbar h-24 w-full bg-gray-800 flex items-center justify-between px-8 fixed top-0 z-50 ${isDarkMode ? 'dark' : ''}`}>
      <div className="logo text-2xl text-white font-bold">VJTI StaySmart</div>

      <div className="hidden md:flex feature text-white text-xl items-center gap-6">
        <Link to="/" className="hover:text-blue-500">Home</Link>

        <div
          className="relative"
          onMouseEnter={() => toggleDropdown(setHostelDropdownVisible, true)}
          onMouseLeave={() => toggleDropdown(setHostelDropdownVisible, false)}
        >
          <button className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg hover:text-blue-500 transition-all duration-300">
            <span>Hostel</span>
            <span className="text-sm transition-transform duration-300">
              &#x25BC;
            </span>
          </button>
          {isHostelDropdownVisible && (
            <div
              className="absolute left-0 mt-2 w-40 bg-white text-black border border-gray-300 shadow-lg rounded transition-all duration-300 z-10"
              onMouseEnter={() => toggleDropdown(setHostelDropdownVisible, true)}
              onMouseLeave={() => toggleDropdown(setHostelDropdownVisible, false)}
            >
              <Link to="RoomAllotment" className="block px-4 py-2 hover:bg-gray-200">
                Room Allotment
              </Link>
              <Link to="/Event" className="block px-4 py-2 hover:bg-gray-200">
                Events
              </Link>
              <Link to="/LostnFound" className="block px-4 py-2 hover:bg-gray-200">
                Lost and Found
              </Link>
              <Link to="#" className="block px-4 py-2 hover:bg-gray-200">
                Community Forum
              </Link>
              <Link to="HostelFeedback" className="block px-4 py-2 hover:bg-gray-200">
                Feedback
              </Link>
              <Link to="HostelLeavingForm" className="block px-4 py-2 hover:bg-gray-200">
                Hostel Leaving Registration
              </Link>
            </div>
          )}
        </div>

        <div
          className="relative"
          onMouseEnter={() => toggleDropdown(setMessDropdownVisible, true)}
          onMouseLeave={() => toggleDropdown(setMessDropdownVisible, false)}
        >
          <button className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg hover:text-blue-500 transition-all duration-300">
            <span>Mess</span>
            <span className="text-sm transition-transform duration-300">
              &#x25BC;
            </span>
          </button>
          {isMessDropdownVisible && (
            <div
              className="absolute left-0 mt-2 w-40 bg-white text-black border border-gray-300 shadow-lg rounded transition-all duration-300 z-10"
              onMouseEnter={() => toggleDropdown(setMessDropdownVisible, true)}
              onMouseLeave={() => toggleDropdown(setMessDropdownVisible, false)}
            >
              <Link to="MessBill" className="block px-4 py-2 hover:bg-gray-200">
                Mess Bill
              </Link>
              <Link to="MessFeedback" className="block px-4 py-2 hover:bg-gray-200">
                Feedback
              </Link>
              <Link to="/messschedule" className="block px-4 py-2 hover:bg-gray-200">
                Schedule and Menu
              </Link>
              <Link to="#" className="block px-4 py-2 hover:bg-gray-200">
                Mess Off Facility
              </Link>
            </div>
          )}
        </div>

        <Link to="/complaint">
          <button className="hover:text-blue-500">Complaint</button>
        </Link>

        <button
          id="dark-mode-toggle"
          className="text-white hover:text-blue-500"
          onClick={toggleDarkMode}
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>

        <button className="px-4 py-2 border border-blue-500 rounded-md hover:bg-blue-500 transition">
          <Link to="/login">Login</Link>
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition">
          <Link to="/Signup">Signup</Link>
        </button>
      </div>

      <div className="md:hidden flex items-center">
        <button onClick={toggleMobileMenu} className="text-white">
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-24 left-0 w-full bg-gray-800 text-white flex flex-col items-center gap-4 py-4 md:hidden">
          <Link to="/" className="hover:text-blue-500" onClick={toggleMobileMenu}>Home</Link>
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg hover:text-blue-500 transition-all duration-300" onClick={() => toggleDropdown(setHostelDropdownVisible, !isHostelDropdownVisible)}>
              <span>Hostel</span>
              <span className="text-sm transition-transform duration-300">
                &#x25BC;
              </span>
            </button>
            {isHostelDropdownVisible && (
              <div className="mt-2 w-40 bg-white text-black border border-gray-300 shadow-lg rounded transition-all duration-300 z-10">
                <Link to="#" className="block px-4 py-2 hover:bg-gray-200" onClick={toggleMobileMenu}>
                  Room Allotment
                </Link>
                <Link to="/Event" className="block px-4 py-2 hover:bg-gray-200" onClick={toggleMobileMenu}>
                  Events
                </Link>
                <Link to="/LostnFound" className="block px-4 py-2 hover:bg-gray-200" onClick={toggleMobileMenu}>
                  Lost and Found
                </Link>
                <Link to="#" className="block px-4 py-2 hover:bg-gray-200" onClick={toggleMobileMenu}>
                  Community Forum
                </Link>
                <Link to="#" className="block px-4 py-2 hover:bg-gray-200" onClick={toggleMobileMenu}>
                  Feedback
                </Link>
                <Link to="#" className="block px-4 py-2 hover:bg-gray-200" onClick={toggleMobileMenu}>
                  Hostel Leaving Registration
                </Link>
              </div>
            )}
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg hover:text-blue-500 transition-all duration-300" onClick={() => toggleDropdown(setMessDropdownVisible, !isMessDropdownVisible)}>
              <span>Mess</span>
              <span className="text-sm transition-transform duration-300">
                &#x25BC;
              </span>
            </button>
            {isMessDropdownVisible && (
              <div className="mt-2 w-40 bg-white text-black border border-gray-300 shadow-lg rounded transition-all duration-300 z-10">
                <Link to="#" className="block px-4 py-2 hover:bg-gray-200" onClick={toggleMobileMenu}>
                  Mess Bill
                </Link>
                <Link to="#" className="block px-4 py-2 hover:bg-gray-200" onClick={toggleMobileMenu}>
                  Feedback
                </Link>
                <Link to="/messschedule" className="block px-4 py-2 hover:bg-gray-200" onClick={toggleMobileMenu}>
                  Schedule and Menu
                </Link>
                <Link to="#" className="block px-4 py-2 hover:bg-gray-200" onClick={toggleMobileMenu}>
                  Mess Off Facility
                </Link>
              </div>
            )}
          </div>

          <Link to="/complaint" onClick={toggleMobileMenu}>
            <button className="hover:text-blue-500">Complaint</button>
          </Link>

          <button
            id="dark-mode-toggle"
            className="text-white hover:text-blue-500"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>

          <button className="px-4 py-2 border border-blue-500 rounded-md hover:bg-blue-500 transition">
            <Link to="/login" onClick={toggleMobileMenu}>Login</Link>
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition">
            <Link to="/Signup" onClick={toggleMobileMenu}>Signup</Link>
          </button>
        </div>
      )}
    </div>
  );
}

export default Navbar;
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSun, FaMoon, FaBars, FaTimes } from "react-icons/fa";
import myHook from "./Context";
import { LuCircleUser } from "react-icons/lu";

function Navbar() {
  const [isHostelDropdownVisible, setHostelDropdownVisible] = useState(false);
  const [isMessDropdownVisible, setMessDropdownVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = myHook();
  const navigate = useNavigate();

  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }

    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setHostelDropdownVisible(false);
        setMessDropdownVisible(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleHostelClick = (e) => {
    e.stopPropagation();
    setMessDropdownVisible(false);
    setHostelDropdownVisible(!isHostelDropdownVisible);
  };

  const handleMessClick = (e) => {
    e.stopPropagation();
    setHostelDropdownVisible(false);
    setMessDropdownVisible(!isMessDropdownVisible);
  };

  const handleDropdownClick = () => {
    setHostelDropdownVisible(false);
    setMessDropdownVisible(false);
    setIsMobileMenuOpen(false);
  };

  const handleNavigate = () => {
    // This will navigate to the specified URL
    navigate("http://localhost:8081/");
  };
  const gotoProfile = () => {
    navigate("/Profile");
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
    setHostelDropdownVisible(false);
    setMessDropdownVisible(false);
  };

  return (
    <div className={`navbar h-20 w-full bg-gray-800 flex items-center justify-between px-8 fixed top-0 z-50 ${isDarkMode ? "dark" : ""}`}>
      <div className="logo text-2xl text-white font-bold">VJTI StaySmart</div>

      <div className="hidden md:flex feature text-white text-xl items-center gap-6">
        <Link to="/" className="hover:text-blue-500">Home</Link>

        <div className="relative dropdown-container">
          <button 
            className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg hover:text-blue-500"
            onClick={handleHostelClick}
          >
            <span>Hostel</span>
            <span className="text-sm">&#x25BC;</span>
          </button>
          {isHostelDropdownVisible && (
            <div className="absolute left-0 mt-2 w-40 bg-white text-black border border-gray-300 shadow-lg rounded z-10">
              <Link to="/Event" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                Events
              </Link>
              {user && (
                <>
                  <Link to="RoomAllotment" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                    Room Allotment
                  </Link>
                  <Link to="/LostnFound" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                    Lost and Found
                  </Link>
                  <Link to="http://localhost:8081/" className="block px-4 py-2 hover:bg-gray-200">
  Community Forum
</Link> 
                  <Link to="HostelFeedback" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                    Feedback
                  </Link>
                  <Link to="HostelLeavingForm" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                    Hostel Leaving Registration
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <div className="relative dropdown-container">
          <button 
            className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg hover:text-blue-500"
            onClick={handleMessClick}
          >
            <span>Mess</span>
            <span className="text-sm">&#x25BC;</span>
          </button>
          {isMessDropdownVisible && (
            <div className="absolute left-0 mt-2 w-40 bg-white text-black border border-gray-300 shadow-lg rounded z-10">
              <Link to="/messschedule" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                Schedule and Menu
              </Link>
              {user && (
                <>
                  <Link to="MessBill" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                    Mess Bill
                  </Link>
                  <Link to="MessFeedback" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                    Feedback
                  </Link>
                  <Link to="/messoff" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                    Mess Off Facility
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <Link to="/complaint">
          <button className="hover:text-blue-500">Complaint</button>
        </Link>

        {!user ? (
          <>
            <button className="px-4 py-2 border border-blue-500 rounded-md hover:bg-blue-500 transition">
              <Link to="/login">Login</Link>
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition">
              <Link to="/Signup">Signup</Link>
            </button>
          </>
        ) : (
          <LuCircleUser className="text-4xl cursor-pointer" onClick={gotoProfile} />
        )}
      </div>

      <div className="md:hidden flex items-center">
        <button onClick={toggleMobileMenu} className="text-white">
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-gray-800 text-white flex flex-col items-center gap-4 py-4 md:hidden">
          <Link to="/" className="hover:text-blue-500" onClick={handleDropdownClick}>
            Home
          </Link>

          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg hover:text-blue-500"
              onClick={() => setHostelDropdownVisible(!isHostelDropdownVisible)}
            >
              <span>Hostel</span>
              <span className="text-sm">&#x25BC;</span>
            </button>
            {isHostelDropdownVisible && (
              <div className="w-40 bg-white text-black border border-gray-300 shadow-lg rounded">
                <Link to="/Event" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                  Events
                </Link>
                {user && (
                  <>
                    <Link to="RoomAllotment" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                      Room Allotment
                    </Link>
                    <Link to="/LostnFound" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                      Lost and Found
                    </Link>
                    <Link to="#" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                      Community Forum
                    </Link>
                    <Link to="HostelFeedback" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                      Feedback
                    </Link>
                    <Link to="HostelLeavingForm" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                      Hostel Leaving Registration
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg hover:text-blue-500"
              onClick={() => setMessDropdownVisible(!isMessDropdownVisible)}
            >
              <span>Mess</span>
              <span className="text-sm">&#x25BC;</span>
            </button>
            {isMessDropdownVisible && (
              <div className="w-40 bg-white text-black border border-gray-300 shadow-lg rounded">
                <Link to="/messschedule" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                  Schedule and Menu
                </Link>
                {user && (
                  <>
                    <Link to="MessBill" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                      Mess Bill
                    </Link>
                    <Link to="MessFeedback" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                      Feedback
                    </Link>
                    <Link to="/messoff" className="block px-4 py-2 hover:bg-gray-200" onClick={handleDropdownClick}>
                      Mess Off Facility
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <Link to="/complaint" onClick={handleDropdownClick}>
            <button className="hover:text-blue-500">Complaint</button>
          </Link>

          {!user ? (
            <>
              <button className="px-4 py-2 border border-blue-500 rounded-md hover:bg-blue-500 transition">
                <Link to="/login" onClick={handleDropdownClick}>Login</Link>
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition">
                <Link to="/Signup" onClick={handleDropdownClick}>Signup</Link>
              </button>
            </>
          ) : (
            <LuCircleUser className="text-4xl cursor-pointer" onClick={() => { gotoProfile(); handleDropdownClick(); }} />
          )}
        </div>
      )}
    </div>
  );
}

export default Navbar;
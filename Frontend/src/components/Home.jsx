import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaRegLightbulb, FaEnvelope, FaPhone } from "react-icons/fa";
import NoticeBoard from "./NoticeBoard";
import hostelImg from "../assets/hostelimg.jpg";
import djnight from "../assets/djnight.jpg";
import holi from "../assets/holi.jpg";
import cricket from "../assets/cricket.jpg";

function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkMode);
  }, []);

  const notices = [
    {
      title: "Hostel Registration Extended",
      description: "Deadline extended to Jan 31, 2025. Complete your forms soon!",
    },
    {
      title: "Annual Hostel Fest",
      description: "Join us on Feb 10th for the Annual Hostel Fest. Fun and excitement await!",
    },
    {
      title: "Mess Feedback",
      description: "New menu testing is underway. Share your feedback on the portal.",
    },
  ];

  const messages = [
    "Welcome to VJTI StaySmart",
    "Redefining Hostel Living",
    "Your Smart Hostel Solution",
  ];

  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);

  const colors = ["#60a5fa", "#ff6347", "#32cd32", "#ff1493"];

  useEffect(() => {
    const typewriter = setInterval(() => {
      setCurrentText((prev) =>
        messages[currentIndex].slice(0, charIndex + 1)
      );
      setCharIndex((prev) => prev + 1);

      if (charIndex === messages[currentIndex].length) {
        clearInterval(typewriter);
        setTimeout(() => {
          setCharIndex(0);
          setCurrentIndex((prev) => (prev + 1) % messages.length);
          setColorIndex((prev) => (prev + 1) % colors.length);
        }, 2000);
      }
    }, 100);

    return () => clearInterval(typewriter);
  }, [charIndex, currentIndex, messages, colorIndex]);

  return (
    <div className={`home-container ${isDarkMode ? 'dark' : ''}`}>
      {/* Hero Section */}
      <div className="relative h-screen bg-gradient-to-b from-[#1f2937] to-[#111827] text-white overflow-hidden">
        {/* Background Animated Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 opacity-10 animate-gradient" />
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between h-full px-8">
          {/* Left Section */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <motion.h1
              className="text-4xl md:text-5xl font-bold leading-snug text-left text-transparent bg-clip-text bg-gradient-to-r from-[#ff6347] via-[#60a5fa] to-[#32cd32] tracking-wide"
              style={{ fontFamily: "'Poppins', sans-serif" }} // Custom font for extra style
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.7, // Faster typing
                ease: "easeOut",
                bounce: 0.4, // Bounce effect for added dynamism
              }}
            >
              {currentText}
              <span className="text-5xl md:text-6xl animate-blink">|</span> {/* Blinking cursor */}
            </motion.h1>

            <motion.p
              className="mt-6 text-lg md:text-xl font-medium leading-relaxed text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Experience comfort, convenience, and collaboration at your hostel.
              <br /> Stay connected, stay inspired, and make every day count.
            </motion.p>
            <motion.a
              href="#gallery"
              className="mt-8 inline-block px-8 py-4 bg-[#2f5583] text-white text-sm font-semibold uppercase rounded-lg shadow-md transition-all duration-300 hover:bg-blue-700 hover:shadow-lg transform hover:scale-105"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Explore Gallery
            </motion.a>
          </div>

          {/* Right Section */}
          <motion.div
            className="w-full md:w-1/2 flex items-center justify-center mt-24"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <img
              src={hostelImg}
              alt="Hostel Life"
              className="max-w-md md:max-w-lg rounded-2xl shadow-2xl shadow-white transform hover:scale-105 transition duration-300 ease-in-out"
            />
          </motion.div>
        </div>
      </div>

      {/* Notice Board Section */}
      <div className="py-12 bg-gray-800">
        <motion.h2
          className="text-4xl font-bold text-[#60a5fa] text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Notice Board
        </motion.h2>
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <NoticeBoard notices={notices} />
        </motion.div>
      </div>

      {/* Events Section */}
      <div className="py-12 bg-slate-800">
        <h2 className="text-4xl font-bold text-[#60a5fa] text-center mb-12">
          Upcoming Events
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
          <motion.div
            className="relative group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src={djnight} alt="DJ Night" className="w-full h-64 object-cover rounded-lg group-hover:blur-none group-hover:scale-105 transition duration-300 ease-in-out" />
            <h3 className="text-2xl font-semibold text-white absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              DJ Night
            </h3>
          </motion.div>

          <motion.div
            className="relative group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src={holi} alt="Holi Celebration" className="w-full h-64 object-cover rounded-lg group-hover:blur-none group-hover:scale-105 transition duration-300 ease-in-out" />
            <h3 className="text-2xl font-semibold text-white absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Holi Celebration
            </h3>
          </motion.div>

          <motion.div
            className="relative group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src={cricket} alt="Cricket Tournament" className="w-full h-64 object-cover rounded-lg group-hover:blur-none group-hover:scale-105 transition duration-300 ease-in-out" />
            <h3 className="text-2xl font-semibold text-white absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Cricket Tournament
            </h3>
            <button className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-transparent text-white px-4 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-700">
              View More
            </button>
          </motion.div>
        </div>
      </div>

      {/* Additional Section: Features */}
      <div className="py-12 bg-gray-800">
        <h2 className="text-4xl font-bold text-[#60a5fa] text-center mb-12">
          Why Choose StaySmart?
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
          <motion.div
            className="bg-gray-700 rounded-lg p-6 shadow-md hover:shadow-xl transform transition-all hover:scale-105"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FaRegLightbulb className="text-6xl text-[#60a5fa] mb-4 mx-auto" />
            <h3 className="text-2xl font-semibold text-white">Innovative Features</h3>
            <p className="text-gray-300 mt-4">
              From smart attendance to feedback systems, we’ve got you covered.
            </p>
          </motion.div>

          <motion.div
            className="bg-gray-700 rounded-lg p-6 shadow-md hover:shadow-xl transform transition-all hover:scale-105"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FaEnvelope className="text-6xl text-[#60a5fa] mb-4 mx-auto" />
            <h3 className="text-2xl font-semibold text-white">Seamless Communication</h3>
            <p className="text-gray-300 mt-4">
              Stay updated with instant notifications and notices.
            </p>
          </motion.div>

          <motion.div
            className="bg-gray-700 rounded-lg p-6 shadow-md hover:shadow-xl transform transition-all hover:scale-105"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FaPhone className="text-6xl text-[#60a5fa] mb-4 mx-auto" />
            <h3 className="text-2xl font-semibold text-white">24/7 Support</h3>
            <p className="text-gray-300 mt-4">
              Dedicated support to address all your queries and complaints.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`bg-[#1f2937] py-6 text-center text-[#d1d5db] ${isDarkMode ? 'dark' : ''}`}>
      </footer>
    </div>
  );
}

export default Home;
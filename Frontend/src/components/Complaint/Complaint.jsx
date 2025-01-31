import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import myHook from "../Context"
function ComplaintForm(r) {
  const {user}=myHook()
  const [complaintType, setComplaintType] = useState("hostel");
  const [complaintDetails, setComplaintDetails] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const handleComplaintChange = (e) => {
    setComplaintDetails(e.target.value);
  };

  const handleAnonymousChange = () => {
    setIsAnonymous(!isAnonymous);
    if (!isAnonymous) {
      setName("");
      setEmail("");
    } else {
      setName(user?.name || "");
      setEmail(user?.email || "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const complaintData = {
      name,
      email,
      details: complaintDetails
    };

    console.log(complaintData)

    try {
      const response = await axios.post("http://localhost:5000/api/v1/hostel/complaint", complaintData);
      if (response.status === 200) {
        alert("Complaint submitted successfully!");
        setComplaintDetails("");
      } else {
        alert("Failed to submit complaint. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="py-12 bg-gradient-to-r from-[#1f2937] to-[#111827] pt-28 text-white">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg p-8 shadow-lg">
        <motion.h2
          className="text-3xl font-bold text-[#60a5fa] text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {complaintType === "hostel" ? "Hostel Complaint" : "Mess Complaint"}
        </motion.h2>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center mb-6">
            <button
              type="button"
              className={`px-6 py-2 mx-2 rounded-full font-semibold transition-all duration-300 ${
                complaintType === "hostel" ? "bg-[#60a5fa]" : "bg-gray-700"
              }`}
              onClick={() => setComplaintType("hostel")}
            >
              Hostel
            </button>
            <button
              type="button"
              className={`px-6 py-2 mx-2 rounded-full font-semibold transition-all duration-300 ${
                complaintType === "mess" ? "bg-[#60a5fa]" : "bg-gray-700"
              }`}
              onClick={() => setComplaintType("mess")}
            >
              Mess
            </button>
          </div>

          {/* {!isAnonymous && ( */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-lg">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 mt-2 bg-gray-700 rounded-md"
                  placeholder="Your name"
                  disabled
                />
              </div>

              <div>
                <label className="block text-lg">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 mt-2 bg-gray-700 rounded-md"
                  placeholder="Your email"
                  disabled
                />
              </div>
            </div>
          {/* )} */}

          <div className="mb-6">
            <label className="block text-lg">Complaint Details</label>
            <textarea
              value={complaintDetails}
              onChange={handleComplaintChange}
              className="w-full px-4 py-2 mt-2 bg-gray-700 rounded-md"
              placeholder="Describe your complaint"
              rows="6"
            ></textarea>
          </div>

          {/* <div className="flex items-center mb-6">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={handleAnonymousChange}
              className="mr-2"
            />
            <span>Submit Anonymously</span>
          </div> */}

          <div className="flex justify-center">
            <button
              type="submit"
              className="px-6 py-3 bg-[#60a5fa] rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300"
            >
              Submit Complaint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComplaintForm;
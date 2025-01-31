import { useState, useEffect } from "react";
import axios from "axios";
import myHook from "../Context"
import { useNavigate } from 'react-router-dom'
export default function MessOffForm() {
  const { user } = myHook()
  const [type, setType] = useState("Off")
  const [formData, setFormData] = useState({
    option: "Off",
    name: user.name,
    email: user.email,
    date: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (value) => {
    setFormData((prev) => ({ ...prev, option: value }));
  };
  const navigate = useNavigate()
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/v1/hostel/messoff",
        formData
      );
      console.log(response)
      if (response.status === 201) {
        alert(response.data.message);
        // setFormData({
        //   option: "Off",
        //   name: "",
        //   email: "",
        //   date: "",
        // });
        navigate("/")
      } else {
        alert("Failed to submit the form. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-lg p-6 shadow-lg rounded-2xl bg-gray-800 text-white">
        <h2 className="text-2xl font-semibold text-center text-slate-300 mb-4">
          Mess Facility Request
        </h2>
        <div className="mb-4 flex justify-center space-x-4 bg-gray-800 p-2 rounded-lg">
          <button
            className={`px-4 py-2 rounded-lg ${formData.option === "Off"
                ? "bg-gray-600 text-white"
                : "text-white"
              }`}
            onClick={() => handleOptionChange("Off")}
          >
            Mess Off
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${formData.option === "Join"
                ? "bg-gray-600 text-white"
                : "text-white"
              }`}
            onClick={() => handleOptionChange("Join")}
          >
            Rejoin Mess
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            disabled
            required
            className="w-full p-2 bg-gray-900 text-white rounded-lg"
          />
          <input
            type="text"
            name="email"
            placeholder="Registration ID"
            value={formData.email}
            // onChange={handleChange}
            required
            disabled
            className="w-full p-2 bg-gray-900 text-white rounded-lg"
          />
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-900 text-white rounded-lg"
            min={new Date().toISOString().split("T")[0]} // Restrict past dates
          />

          <button
            type="submit"
            className="w-full bg-teal-500 text-black p-2 rounded-lg"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}

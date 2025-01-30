import { useState, useEffect } from "react";
import axios from "axios";

export default function MessOffForm() {
  const [formData, setFormData] = useState({
    option: "Off",
    name: "",
    rollNumber: "",
    date: "",
  });
  const history = useHistory();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Replace this with your actual API endpoint
    axios.get("/api/check-auth")
      .then(response => {
        if (response.data.isAuthenticated) {
          setIsAuthenticated(true);
        } else {
          history.push("/login");
        }
      })
      .catch(error => {
        console.error("Error checking authentication", error);
        history.push("/login");
      });
  }, [history]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (value) => {
    setFormData((prev) => ({ ...prev, option: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  if (!isAuthenticated) {
    return <div>Please log in to access this form.</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-lg p-6 shadow-lg rounded-2xl bg-gray-800 text-white">
        <h2 className="text-2xl font-semibold text-center text-slate-300 mb-4">Mess Facility Request</h2>
        <div className="mb-4 flex justify-center space-x-4 bg-gray-800 p-2 rounded-lg">
          <button
            className={`px-4 py-2 rounded-lg ${formData.option === "Off" ? "bg-gray-600 text-white" : "text-white"}`}
            onClick={() => handleOptionChange("Off")}
          >
            Mess Off
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${formData.option === "Join" ? "bg-gray-600 text-white" : "text-white"}`}
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
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-900 text-white rounded-lg"
          />
          <input
            type="text"
            name="rollNumber"
            placeholder="Registration ID"
            value={formData.rollNumber}
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-900 text-white rounded-lg"
          />
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-900 text-white rounded-lg"
          />
          <button type="submit" className="w-full bg-[#ffcc00] text-black p-2 rounded-lg">Submit Request</button>
        </form>
      </div>
    </div>
  );
}
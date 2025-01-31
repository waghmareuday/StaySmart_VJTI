import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

function HostelLeavingForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    roomNo: '',
    dateOfDeparture: '',
    contact: '',
    reason: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/v1/hostel/hostelLeaving', formData);
      if (response.status === 200) {
        alert(response.data.message);
        setFormData({
          name: '',
          rollNo: '',
          roomNo: '',
          dateOfDeparture: '',
          contact: '',
          reason: ''
        });
        navigate('/');
      } else {
        alert("Failed to submit registration Form");
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-28 bg-gray-900 py-10">
      <div className="w-full max-w-4xl p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-blue-400 mb-6">Hostel Leaving Form</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-white block mb-2">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600" placeholder="John Doe"/>
          </div>
          <div>
            <label className="text-white block mb-2">Roll Number</label>
            <input type="text" name="rollNo" value={formData.rollNo} onChange={handleChange} className="w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600" placeholder="12345"/>
          </div>
          <div>
            <label className="text-white block mb-2">Room Number</label>
            <input type="text" name="roomNo" value={formData.roomNo} onChange={handleChange} className="w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600" placeholder="101"/>
          </div>
          <div>
            <label className="text-white block mb-2">Date of Departure</label>
            <input type="date" name="dateOfDeparture" value={formData.dateOfDeparture} onChange={handleChange} className="w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600"/>
          </div>
          <div className="col-span-2">
            <label className="text-white block mb-2">Reason for Leaving</label>
            <textarea name="reason" value={formData.reason} onChange={handleChange} className="w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600" placeholder="Explain your reason for leaving" rows="4"></textarea>
          </div>
          <div>
            <label className="text-white block mb-2">Contact Number</label>
            <input type="text" name="contact" value={formData.contact} onChange={handleChange} className="w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600" placeholder="9876543210"/>
          </div>
          <div className="col-span-2 text-center">
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg">Submit Form</button>
          </div>
        </form>
        <div className="text-center mt-6">
          <p className="text-gray-300">Have any questions? <Link to="/Contact" className="text-blue-400 hover:underline">Contact Us</Link></p>
        </div>
      </div>
    </div>
  );
}

export default HostelLeavingForm;

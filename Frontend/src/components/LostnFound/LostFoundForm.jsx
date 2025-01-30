import React, { useState } from 'react';
import axios from 'axios'; 
import Listings from './Listings';

function LostFoundForm() {
  const [formData, setFormData] = useState({
    itemType: '',
    itemName: '',
    description: '',
    location: '',
    contact: '',
    imageURL: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setFormData({ ...formData, imageURL });
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/v1/hostel/lostnfound', formData);

      if (response.status === 200) {
        alert(response.data.message);
        setFormData({
          itemType: '',
          itemName: '',
          description: '',
          location: '',
          contact: '',
          imageURL: '',
        });
      } else {
        alert('Failed to submit the form. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="bg-gray-800 shadow-md p-6 w-100 h-full flex flex-col justify-center items-center pb-4 pt-24">
      <section className="text-center mb-8">
        <h1 className="headline text-4xl font-bold mb-4 text-[#60a5fa]">Lost and Found</h1>
        <p className="text-white">
          If you have lost or found an item on campus, please submit the details below.
        </p>
      </section>

      <div className="bg-gray-700 rounded-lg shadow-md p-6 w-[60%]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="itemType" className="block text-white font-semibold">Type of Item:</label>
            <select
              id="itemType"
              name="itemType"
              value={formData.itemType}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
            >
              <option value="">Select...</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="itemName" className="block text-white font-semibold">Item Name:</label>
            <input
              type="text"
              id="itemName"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              placeholder="E.g., Laptop, Wallet"
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="block text-white font-semibold">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide details about the item."
              rows="4"
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="location" className="block text-white font-semibold">Last Seen/Found Location:</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="E.g., Hostel Room 101"
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact" className="block text-white font-semibold">Contact Information:</label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange} 
              placeholder="Email or Phone Number"
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image" className="block text-white font-semibold">Upload Image (Optional):</label>
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleFileChange}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
          </div>

          <button
            type="submit" 
            className="btn w-full p-2 text-white rounded font-semibold bg-blue-700 hover:bg-blue-500"
          >
            Submit
          </button>
        </form>
      </div>

      <Listings />
    </div>
  );
}

export default LostFoundForm;

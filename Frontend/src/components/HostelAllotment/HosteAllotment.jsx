import React from 'react';

function RoomAllotmentForm() {
  return (
    <div className="bg-gray-900 min-h-screen flex justify-center items-center">
      <div className="w-full max-w-lg p-8 bg-gray-800 rounded-lg shadow-lg ">
        <h2 className="text-2xl font-bold text-center text-blue-400 mb-6">Room Allotment Form</h2>
        <p className="text-gray-300 text-center mb-4">
          Please fill out the form below to request a room allotment.
        </p>
        <form className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
              Your Full Name:
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="E.g., John Doe"
              className="w-full p-3 bg-gray-700 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Roll Number */}
          <div>
            <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-300 mb-1">
              Roll Number:
            </label>
            <input
              type="text"
              id="rollNumber"
              name="rollNumber"
              placeholder="E.g., 12345"
              className="w-full p-3 bg-gray-700 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-1">
              Department:
            </label>
            <input
              type="text"
              id="department"
              name="department"
              placeholder="E.g., Computer Science"
              className="w-full p-3 bg-gray-700 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Preferred Room Type */}
          <div>
            <label htmlFor="roomType" className="block text-sm font-medium text-gray-300 mb-1">
              Preferred Room Type:
            </label>
            <select
              id="roomType"
              name="roomType"
              className="w-full p-3 bg-gray-700 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select...</option>
              <option value="single">Single Room</option>
              <option value="double">Double Room</option>
              <option value="triple">Triple Room</option>
            </select>
          </div>

          {/* Date of Arrival */}
          <div>
            <label htmlFor="arrivalDate" className="block text-sm font-medium text-gray-300 mb-1">
              Date of Arrival:
            </label>
            <input
              type="date"
              id="arrivalDate"
              name="arrivalDate"
              className="w-full p-3 bg-gray-700 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-300 mb-1">
              Contact Number:
            </label>
            <input
              type="text"
              id="contact"
              name="contact"
              placeholder="E.g., 9876543210"
              className="w-full p-3 bg-gray-700 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Reason for Room Request */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-1">
              Reason for Room Request:
            </label>
            <textarea
              id="reason"
              name="reason"
              placeholder="Explain the reason for requesting the room."
              rows="3"
              className="w-full p-3 bg-gray-700 text-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:outline-none"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoomAllotmentForm;
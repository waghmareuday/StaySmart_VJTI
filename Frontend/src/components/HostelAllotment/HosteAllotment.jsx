import React from 'react';

function RoomAllotmentForm() {
  return (
    <div className="bg-gray-900 min-h-screen flex justify-center items-center pt-28 pb-6">
      <div className="w-full max-w-5xl bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-blue-400 mb-8">Room Allotment Form</h2>
        <p className="text-gray-300 text-center mb-6">
          Please fill out the form below to request a room allotment.
        </p>
        <form className="w-full">
          <table className="table-auto w-full text-left text-gray-300">
            <tbody>
              <tr>
                <td className="py-4 pr-6">
                  <label htmlFor="fullName" className="block font-medium mb-2">
                    Your Full Name:
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="E.g., John Doe"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-blue-500 focus:outline-none"
                  />
                </td>
                <td className="py-4">
                  <label htmlFor="rollNumber" className="block font-medium mb-2">
                    Roll Number:
                  </label>
                  <input
                    type="text"
                    id="rollNumber"
                    name="rollNumber"
                    placeholder="E.g., 12345"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-blue-500 focus:outline-none"
                  />
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6">
                  <label htmlFor="department" className="block font-medium mb-2">
                    Department:
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    placeholder="E.g., Computer Science"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-blue-500 focus:outline-none"
                  />
                </td>
                <td className="py-4">
                  <label htmlFor="roomType" className="block font-medium mb-2">
                    Preferred Room Type:
                  </label>
                  <select
                    id="roomType"
                    name="roomType"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="single">Single Room</option>
                    <option value="double">Double Room</option>
                    <option value="triple">Triple Room</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="py-4 pr-6">
                  <label htmlFor="arrivalDate" className="block font-medium mb-2">
                    Date of Arrival:
                  </label>
                  <input
                    type="date"
                    id="arrivalDate"
                    name="arrivalDate"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-blue-500 focus:outline-none"
                  />
                </td>
                <td className="py-4">
                  <label htmlFor="contact" className="block font-medium mb-2">
                    Contact Number:
                  </label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    placeholder="E.g., 9876543210"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-blue-500 focus:outline-none"
                  />
                </td>
              </tr>
              <tr>
                <td colSpan="2" className="py-4">
                  <label htmlFor="reason" className="block font-medium mb-2">
                    Reason for Room Request:
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    placeholder="Explain the reason for requesting the room."
                    rows="3"
                    className="w-full p-3 bg-gray-700 rounded-lg focus:ring-blue-500 focus:outline-none"
                  ></textarea>
                </td>
              </tr>
              <tr>
                <td colSpan="2" className="py-4 text-center">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:outline-none"
                  >
                    Submit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    </div>
  );
}

export default RoomAllotmentForm;

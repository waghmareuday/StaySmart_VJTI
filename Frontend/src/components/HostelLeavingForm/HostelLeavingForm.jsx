import React from 'react'
import { Link } from 'react-router-dom'

function HostelLeavingForm() {
  return (
    <>
        <div className="bg-gray-900 min-h-screen flex justify-center items-center">
        <div className="w-full max-w-lg p-8 bg-gray-800 rounded-lg shadow-lg ">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-[#60a5fa] dark:text-[#60a5fa] text-center">
                Hostel Leaving Form
              </h1>

              <form className="space-y-4 md:space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your Full Name</label>
                  <input type="text" name="fullName" id="fullName" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="John Doe"/>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Roll Number</label>
                  <input type="text" name="rollNumber" id="rollNumber" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="12345"/>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Hostel Room Number</label>
                  <input type="text" name="roomNumber" id="roomNumber" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="101"/>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date of Departure</label>
                  <input type="date" name="departureDate" id="departureDate" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"/>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Reason for Leaving</label>
                  <textarea name="reason" id="reason" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Explain the reason for leaving" rows="4"></textarea>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contact Number</label>
                  <input type="text" name="contact" id="contact" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="9876543210"/>
                </div>

                <div className="mt-6">
                  <button type="submit" className="w-full text-white bg-indigo-600 hover:bg-gray-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                    Submit Form
                  </button>
                </div>
              </form>

              <div className="pt-6">
                <p className="text-sm font-light text-gray-900 dark:text-gray-300 text-center">
                  Have any questions? <Link to="/Contact" className="font-medium hover:underline text-blue-500 hover:text-blue-300">Contact Us</Link>
                </p>
              </div>
            </div>
          </div>
        {/* </div>
      </div> */}
    </>
  )
}

export default HostelLeavingForm;

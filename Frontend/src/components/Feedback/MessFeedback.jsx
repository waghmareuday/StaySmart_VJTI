import React, { useState } from 'react';
import axios from 'axios';
import myHook from "../Context"


function MessFeedback() {
    const { user } = myHook();
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        feedback: '',
        rating: '',
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
            const response = await axios.post('http://localhost:5000/api/v1/feedback/mess', formData);

            if (response.status === 200) {
                alert(response.data.message);

                // Reset the form fields
                setFormData({
                    name: '',
                    email: '',
                    feedback: '',
                    rating: '',
                });
            } else {
                alert('Failed to submit feedback. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    };


    return (
        <div className="bg-gray-900 text-white pt-[8%] font-sans">
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold text-blue-400 mb-4">Mess Feedback Form</h1>
                <p className="text-gray-400 text-center mb-6">We value your feedback! Please take a moment to share your thoughts about our hostel services.</p>

                <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-gray-400 mb-2">Your Name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            disabled
                            className="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Enter your name"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-400 mb-2">Your Email</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            disabled
                            className="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="feedback" className="block text-gray-400 mb-2">Your Feedback</label>
                        <textarea
                            name="feedback"
                            id="feedback"
                            value={formData.feedback}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            rows="4"
                            placeholder="Share your experience"
                            required
                        ></textarea>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="rating" className="block text-gray-400 mb-2">Rate Our Service</label>
                        <select
                            name="rating"
                            id="rating"
                            value={formData.rating}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        >
                            <option value="" disabled>
                                Choose a rating
                            </option>
                            <option value="5">Excellent (5)</option>
                            <option value="4">Very Good (4)</option>
                            <option value="3">Good (3)</option>
                            <option value="2">Fair (2)</option>
                            <option value="1">Poor (1)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full p-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        Submit Feedback
                    </button>
                </form>
            </div>
        </div>
    );
}

export default MessFeedback;

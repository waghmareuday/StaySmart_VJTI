import React from 'react'

function HostelFeedback() {
  return (
    <>
    <div class="bg-gray-900 text-white font-sans">
    <div class="min-h-screen flex flex-col items-center justify-center">
        <h1 class="text-3xl font-bold text-blue-400 mb-4">Mess Feedback Form</h1>
        <p class="text-gray-400 text-center mb-6">We value your feedback! Please take a moment to share your thoughts about our mess services.</p>

        <form class="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
            {/* <!-- Name --> */}
            <div class="mb-4">
                <label for="name" class="block text-gray-400 mb-2">Your Name</label>
                <input
                    type="text"
                    id="name"
                    class="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your name"
                    required
                />
            </div>

            {/* <!-- Email --> */}
            <div class="mb-4">
                <label for="email" class="block text-gray-400 mb-2">Your Email</label>
                <input
                    type="email"
                    id="email"
                    class="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your email"
                    required
                />
            </div>

            {/* <!-- Feedback --> */}
            <div class="mb-4">
                <label for="feedback" class="block text-gray-400 mb-2">Your Feedback</label>
                <textarea
                    id="feedback"
                    class="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows="4"
                    placeholder="Share your experience"
                    required
                ></textarea>
            </div>

            {/* <!-- Rating --> */}
            <div class="mb-4">
                <label for="rating" class="block text-gray-400 mb-2">Rate Our Service</label>
                <select
                    id="rating"
                    class="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                >
                    <option value="" disabled selected>Choose a rating</option>
                    <option value="5">Excellent (5)</option>
                    <option value="4">Very Good (4)</option>
                    <option value="3">Good (3)</option>
                    <option value="2">Fair (2)</option>
                    <option value="1">Poor (1)</option>
                </select>
            </div>

            {/* <!-- Submit Button --> */}
            <button
                type="submit"
                class="w-full p-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
                Submit Feedback
            </button>
        </form>
    </div>
</div>
    </>
  )
}

export default HostelFeedback;
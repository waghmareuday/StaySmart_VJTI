import React from 'react';
import { Link } from 'react-router-dom';

function Signup() {
  return (
    <div className="bg-gradient-to-br bg-gray-900 min-h-screen flex items-center pt-28 justify-center px-12 py-10">
      <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl p-10">
        <h1 className="text-4xl font-semibold text-center text-slate-400 mb-6">
          Create an Account
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Join us and get started with our amazing features.
        </p>
        <form className="space-y-6">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="name@company.com"
              className="bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* College ID Field */}
          <div>
            <label
              htmlFor="collegeId"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              College ID
            </label>
            <input
              type="number"
              id="collegeId"
              name="collegeId"
              placeholder="24#######"
              className="bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="*******"
              className="bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="*******"
              className="bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-base px-5 py-3 transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            Sign Up
          </button>
          <p className="text-sm font-light text-gray-300 text-center mt-4">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-indigo-400 hover:text-indigo-500 hover:underline"
            >
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;

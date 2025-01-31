import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import myHook from '../Context';

function Login() {
  const [password, setpassword] = useState("");
  const [email, setemail] = useState("");
  const { setUser } = myHook();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      email,
      password
    };

    // Check for admin credentials
    if (email === "admin@123" && password === "admin") {
      // If it's admin, navigate to admin dashboard
      navigate("/admin/dashboard ");
      return; // Prevent further logic (no need to send request)
    }

    try {
      const response = await axios.post('http://localhost:5000/api/v1/auth/login', data);

      if (response.status === 200) {
        alert(response.data.message);
        console.log(response.data);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);

        setpassword("");
        setemail("");
        navigate("/");

      } else {
        alert('Failed to Login. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="-gbgray-900 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-slate-400 mb-6">
          Login
        </h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-2 text-sm font-medium text-white">
              Your Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              onChange={(e) => setemail(e.target.value)}
              autocomplete="email"
              className="bg-gray-700 border border-gray-600 text-white rounded-lg block w-full p-2.5 placeholder-gray-400"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-white">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              onChange={(e) => setpassword(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg block w-full p-2.5 placeholder-gray-400"
              placeholder="*******"
              autocomplete="current-password"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="remember"
                id="remember"
                className="w-4 h-4 border border-gray-600 rounded bg-gray-700"
              />
              <label className="ml-2 text-sm text-gray-300">
                Remember Me
              </label>
            </div>
            <Link
              to="#"
              className="text-sm font-medium text-blue-500 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <button
            type="submit"
            className="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            Log In
          </button>
          <p className="text-sm font-light text-gray-300 text-center">
            Don't have an account yet?{' '}
            <Link
              to="/Signup"
              className="font-medium text-blue-500 hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;

import React from "react";
import { useNavigate } from "react-router-dom";
import myHook from "../Context";

function AdminProfile() {
  const { user, setUser } = myHook(); // Get user data from context
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null); // Clear user data
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className="w-[100%] h-[90vh] bg-gray-900 mt-1 flex items-center justify-center">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8">
        {/* Admin Avatar */}
        <div className="flex justify-center mb-6">
          <img
            src={`https://ui-avatars.com/api/?name=Admin&background=random&color=fff`}
            alt="Admin Avatar"
            className="w-32 h-32 rounded-full border-4 border-indigo-500"
          />
        </div>

        {/* Admin Details */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-400 mb-4">Admin Dashboard</h1>
          <p className="text-lg text-slate-300">Welcome, {user?.name}!</p>
          <p className="text-sm text-slate-500 mt-1">Role: Admin</p>
        </div>

        {/* Logout Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;

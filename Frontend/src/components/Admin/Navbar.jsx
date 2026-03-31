import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import myHook from '../Context';

function Navbar() {
  const { user, logout } = myHook();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/Login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-gray-900 border-b border-gray-700 z-40 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl md:text-2xl text-white font-bold">VJTI StaySmart</Link>
        <span className="hidden md:inline-flex text-xs px-2.5 py-1 rounded-full bg-indigo-700 text-white font-medium">
          Admin Panel
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/admin/profile"
          className="text-sm text-slate-200 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg"
        >
          {user?.name || 'Admin'}
        </Link>

        <button
          onClick={handleLogout}
          className="text-sm text-red-300 bg-red-900/30 hover:bg-red-900/50 px-3 py-2 rounded-lg flex items-center gap-2"
        >
          <LuLogOut /> Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
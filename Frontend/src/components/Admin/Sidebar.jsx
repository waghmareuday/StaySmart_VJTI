import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaBullhorn,
  FaClipboardList,
  FaExchangeAlt,
  FaHome,
  FaMoon,
  FaMoneyBillWave,
  FaRegCommentDots,
  FaTools,
  FaWrench
} from 'react-icons/fa';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FaHome },
  { to: '/admin/HostelAllotment', label: 'Hostel Allotment', icon: FaTools },
  { to: '/admin/room-swaps', label: 'Room Swaps', icon: FaExchangeAlt },
  { to: '/admin/maintenance', label: 'Maintenance', icon: FaWrench },
  { to: '/admin/night-out', label: 'Night Out Passes', icon: FaMoon },
  { to: '/admin/notices', label: 'Notice Board', icon: FaBullhorn },
  { to: '/admin/dues', label: 'Dues Management', icon: FaMoneyBillWave },
  { to: '/admin/attendance', label: 'Attendance Reports', icon: FaClipboardList },
  { to: '/admin/messoff', label: 'Mess Off', icon: FaRegCommentDots },
  { to: '/admin/complaint', label: 'Complaints', icon: FaRegCommentDots },
  { to: '/admin/hostelfeedback', label: 'Hostel Feedback', icon: FaRegCommentDots },
  { to: '/admin/messfeedback', label: 'Mess Feedback', icon: FaRegCommentDots }
];

function Sidebar() {
  return (
    <aside className="bg-gray-800 border border-gray-700 rounded-2xl shadow-sm p-4 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 px-3 mb-3">Admin Navigation</p>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-200 hover:bg-gray-700'
                }`
              }
            >
              <Icon className="text-sm" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
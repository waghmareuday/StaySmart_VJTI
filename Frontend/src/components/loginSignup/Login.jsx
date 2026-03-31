import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import myHook from '../Context';
import { API_ENDPOINTS } from '../../config/api';

function Login() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = myHook();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";
  const routeMessage = location.state?.message || '';

  const HARD_CODED_IDS = {
    admin: {
      email: 'admin@123',
      password: 'admin',
      label: 'Admin Login'
    },
    rectors: [
      {
        email: 'chiefwarden@vjti.ac.in',
        password: 'chief123',
        label: 'Chief Rector'
      },
      {
        email: 'wardena@vjti.ac.in',
        password: 'warden123',
        label: 'Rector A Block'
      },
      {
        email: 'wardenc@vjti.ac.in',
        password: 'warden123',
        label: 'Rector PG Hostel (C + PG)'
      }
    ]
  };

  const fillCredentials = (selectedRole, selectedEmail, selectedPassword) => {
    setRole(selectedRole);
    setEmail(selectedEmail);
    setPassword(selectedPassword);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Warden login
      if (role === 'warden') {
        const response = await fetch(API_ENDPOINTS.WARDEN_LOGIN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (data.success) {
          const wardenUser = {
            ...data.warden,
            role: 'warden',
            isWarden: true,
            isAdmin: false
          };
          localStorage.setItem('user', JSON.stringify(wardenUser));
          localStorage.setItem('wardenToken', data.token);
          localStorage.removeItem('authToken');
          setUser(wardenUser);
          navigate("/Attendance");
          return;
        } else {
          setError(data.message || 'Invalid warden credentials');
          setLoading(false);
          return;
        }
      }

      // Student/Admin login via unified backend auth endpoint
      const response = await axios.post(API_ENDPOINTS.LOGIN, { email, password });

      if (response.status === 200 && response.data.user && response.data.success) {
        const serverUser = response.data.user;
        const serverRole = serverUser.role || 'student';

        if (role === 'admin' && serverRole !== 'admin' && serverUser.isAdmin !== true) {
          setError('Admin access denied for this account');
          setLoading(false);
          return;
        }

        if (role === 'student' && (serverRole === 'admin' || serverUser.isAdmin === true)) {
          setError('Use Admin role tab to login with this account');
          setLoading(false);
          return;
        }

        const userObj = { 
          ...serverUser,
          studentId: String(serverUser.collegeId || serverUser.studentId || ''),
          role: serverRole,
          isAdmin: serverUser.isAdmin === true || serverRole === 'admin'
        };
        
        localStorage.setItem('user', JSON.stringify(userObj));
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        localStorage.removeItem('wardenToken');
        setUser(userObj);
        if (userObj.isAdmin) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        setError(response.data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    }
    setLoading(false);
  };

  const roleConfig = {
    student: { icon: '🎓', label: 'Student' },
    warden: { icon: '🛡️', label: 'Rector' },
    admin: { icon: '⚙️', label: 'Admin' }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-10 pt-28">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-300">StaySmart Login</h1>
          <p className="text-sm text-gray-300 mt-1">Access your student, rector, or admin portal</p>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl p-6">
          {routeMessage && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2 text-sm">
              {routeMessage}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-6">
            {Object.entries(roleConfig).map(([key, { icon, label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-400"
                  placeholder={role === 'warden' ? 'chiefwarden@vjti.ac.in' : role === 'admin' ? 'admin@123' : 'student@vjti.ac.in'}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Signing in...
                </span>
              ) : (
                `Sign in as ${roleConfig[role].label}`
              )}
            </button>

            {/* Sign Up Link */}
            {role === 'student' && (
              <p className="text-center text-gray-300 text-sm">
                Don't have an account?{' '}
                <Link to="/Signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Sign up
                </Link>
              </p>
            )}
          </form>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Hardcoded IDs (As Requested)</h2>
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border border-gray-600 px-3 py-2">
              <p className="font-medium text-slate-300">Admin</p>
              <p className="text-gray-300">ID: {HARD_CODED_IDS.admin.email}</p>
              <p className="text-gray-300">Password: {HARD_CODED_IDS.admin.password}</p>
              <button
                type="button"
                onClick={() => fillCredentials('admin', HARD_CODED_IDS.admin.email, HARD_CODED_IDS.admin.password)}
                className="mt-2 text-xs font-medium text-indigo-300 underline"
              >
                Use this ID
              </button>
            </div>

            {HARD_CODED_IDS.rectors.map((rector) => (
              <div key={rector.email} className="rounded-lg border border-gray-600 px-3 py-2">
                <p className="font-medium text-slate-300">{rector.label}</p>
                <p className="text-gray-300">ID: {rector.email}</p>
                <p className="text-gray-300">Password: {rector.password}</p>
                <button
                  type="button"
                  onClick={() => fillCredentials('warden', rector.email, rector.password)}
                  className="mt-2 text-xs font-medium text-indigo-300 underline"
                >
                  Use this ID
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

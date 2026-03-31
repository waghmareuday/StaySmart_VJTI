import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import myHook from '../Context';
import { API_ENDPOINTS } from '../../config/api';

function Login() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = myHook();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";
  const routeMessage = location.state?.message || '';

  const getStudentRedirect = () => {
    if (from && from !== '/Login' && from !== '/Signup') {
      return from;
    }
    return '/student/dashboard';
  };

  const getWardenRedirect = () => {
    if (from && (from.startsWith('/Attendance') || from.startsWith('/Warden'))) {
      return from;
    }
    return '/Attendance';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();

      // Try student/admin auth endpoint first.
      const response = await axios.post(API_ENDPOINTS.LOGIN, {
        email: normalizedEmail,
        password
      });

      if (response.status === 200 && response.data.user && response.data.success) {
        const serverUser = response.data.user;
        const serverRole = serverUser.role || 'student';

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
          navigate(getStudentRedirect(), { replace: true });
        }
        return;
      }
    } catch (authError) {
      const authFailedWithBadCreds = authError.response?.status === 400 || authError.response?.status === 401;

      if (!authFailedWithBadCreds) {
        setError(authError.response?.data?.message || 'Unable to login right now. Please try again.');
        setLoading(false);
        return;
      }

      // If not a student/admin account, try warden auth endpoint.
      try {
        const wardenResponse = await fetch(API_ENDPOINTS.WARDEN_LOGIN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: String(email || '').trim().toLowerCase(), password })
        });
        const wardenData = await wardenResponse.json();

        if (wardenResponse.ok && wardenData.success && wardenData.warden) {
          const wardenUser = {
            ...wardenData.warden,
            role: 'warden',
            isWarden: true,
            isAdmin: false
          };

          localStorage.setItem('user', JSON.stringify(wardenUser));
          localStorage.setItem('wardenToken', wardenData.token);
          localStorage.removeItem('authToken');
          setUser(wardenUser);
          navigate(getWardenRedirect(), { replace: true });
          return;
        }

        setError(wardenData.message || authError.response?.data?.message || 'Invalid email or password');
      } catch {
        setError(authError.response?.data?.message || 'Invalid email or password');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-10 pt-28">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xl font-bold">
            SS
          </div>
          <h1 className="text-3xl font-bold text-slate-300">Welcome Back</h1>
          <p className="text-sm text-gray-300 mt-1">Login to continue to StaySmart</p>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl p-6">
          {routeMessage && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2 text-sm">
              {routeMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-400"
                  placeholder="name@domain.com"
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
              ) : 'Sign in'}
            </button>

            <p className="text-center text-gray-300 text-sm">
              Don't have an account?{' '}
              <Link to="/Signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>

            <p className="text-center text-xs text-gray-400">
              For warden and admin access, use your assigned credentials.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

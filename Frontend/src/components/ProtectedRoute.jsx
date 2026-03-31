import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import myHook from './Context';

/**
 * ProtectedRoute - Require user to be logged in
 * Redirects to login page if not authenticated
 */
export const ProtectedRoute = ({ children }) => {
  const { user } = myHook();
  const location = useLocation();

  if (!user) {
    // Redirect to login page, saving the intended destination
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * AdminRoute - Require user to be an admin
 * Redirects to home if not admin
 */
export const AdminRoute = ({ children }) => {
  const { user } = myHook();
  const location = useLocation();

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  // Check if user is admin (role-based or email-based check)
  const isAdmin = user.role === 'admin' || user.isAdmin === true;
  
  if (!isAdmin) {
    // Regular users trying to access admin routes
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * WardenRoute - Require user to be a warden
 * Redirects to login if not warden
 */
export const WardenRoute = ({ children }) => {
  const { user } = myHook();
  const location = useLocation();

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/Login" state={{ from: location, message: 'Please login as warden' }} replace />;
  }

  // Check if user is warden
  const isWarden = user.role === 'warden' || user.isWarden === true;
  
  if (!isWarden) {
    // Non-wardens trying to access warden routes
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * StudentRoute - Allow only student users
 * Redirect admin/warden users to their dashboards
 */
export const StudentRoute = ({ children }) => {
  const { user } = myHook();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  if (user.role === 'admin' || user.isAdmin === true) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === 'warden' || user.isWarden === true) {
    return <Navigate to="/Attendance" replace />;
  }

  return children;
};

/**
 * GuestRoute - Only accessible when NOT logged in
 * Redirects to home if already logged in (for login/signup pages)
 */
export const GuestRoute = ({ children }) => {
  const { user } = myHook();

  if (user) {
    // Already logged in - redirect based on role
    if (user.role === 'admin' || user.isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'warden' || user.isWarden) {
      return <Navigate to="/Attendance" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

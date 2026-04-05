import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx'; // Make sure path is correct!

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  // 1. If nobody is logged in, kick them back to the login screen
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 2. If a staff member tries to access an admin page (or vice versa),
  // kick them back to their own specific dashboard.
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/staff/dashboard'} replace />;
  }

  // 3. If they are logged in AND have the correct role, render the page!
  return <Outlet />;
};

// 👇 THIS IS THE LINE THAT WAS MISSING! 👇
export default ProtectedRoute;
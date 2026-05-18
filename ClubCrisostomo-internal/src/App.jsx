import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import './mobile/responsive.css';

// Your Bouncer
import ProtectedRoute from "./staff/components/ProtectedRoute.jsx"; 

// --- LOGIN IMPORTS ---
import Login from "./login/login.jsx";

// --- ADMIN IMPORTS ---
import AdminDashboard from "./admin/dashboard/dashboard.jsx";
import Inventory from "./admin/inventory/inventory.jsx";
import Menu from "./admin/menu/menu.jsx";
import StaffManagement from "./admin/staffs-management/staff.jsx";
import Reports from "./admin/reports/reports.jsx";
import SettingsAdmin from "./admin/settingsadmin/settingsadmin.jsx";

// --- STAFF IMPORTS ---
import StaffDashboard from "./staff/dashboard/dashboard.jsx";
import StaffPOS from "./staff/pos/staffpos.jsx"; 
import StaffAttendance from "./staff/attendance/attendance.jsx"; 
import StaffInventory from "./staff/inventory/staffinventory.jsx"; 
import StaffTransactions from "./staff/transactions/stafftransactions.jsx"; 
import StaffSettings from "./staff/settingsstaff/staffsettings.jsx"; 

const App = () => {
  
  // --- THEME LOADER ---
  // Checks the saved theme on load and applies it to the whole website instantly
  useEffect(() => {
    const savedTheme = localStorage.getItem('clubC_admin_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Login />} />
          
          {/* 🔒 ADMIN PROTECTED ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/inventory" element={<Inventory />} /> 
            <Route path="/admin/menu" element={<Menu />} /> 
            <Route path="/admin/staffs-management" element={<StaffManagement />} /> 
            <Route path="/admin/reports" element={<Reports />} /> 
            <Route path="/admin/settingsadmin" element={<SettingsAdmin />} /> 
          </Route>

          {/* 🔒 STAFF PROTECTED ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/pos" element={<StaffPOS />} />
            <Route path="/staff/attendance" element={<StaffAttendance />} /> 
            <Route path="/staff/inventory" element={<StaffInventory />} />
            <Route path="/staff/transactions" element={<StaffTransactions />} />
            <Route path="/staff/settings" element={<StaffSettings />} />
          </Route>

          {/* Catch-all: If someone types a weird URL, send them back to login */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
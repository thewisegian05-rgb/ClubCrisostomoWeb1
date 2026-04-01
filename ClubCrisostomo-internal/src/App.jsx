import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route goes to Login */}
        <Route path="/" element={<Login />} />
        
        {/* Admin Protected Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/inventory" element={<Inventory />} /> 
        <Route path="/admin/menu" element={<Menu />} /> 
        <Route path="/admin/staffs-management" element={<StaffManagement />} /> 
        <Route path="/admin/reports" element={<Reports />} /> 
        <Route path="/admin/settingsadmin" element={<SettingsAdmin />} /> 
        
        {/* Staff Protected Routes */}
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/pos" element={<StaffPOS />} />
        <Route path="/staff/attendance" element={<StaffAttendance />} /> 
        <Route path="/staff/inventory" element={<StaffInventory />} />
        <Route path="/staff/transactions" element={<StaffTransactions />} />
        <Route path="/staff/settings" element={<StaffSettings />} />

        {/* Catch-all: If someone types a weird URL, send them back to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
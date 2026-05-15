import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to check if a menu item is the current page
  const isActive = (path) => location.pathname.includes(path) ? "active" : "";

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>CLUB C.</h2>
        <span style={{color: "var(--text-muted)", fontSize: "0.8rem", letterSpacing: "1px"}}>STAFF PORTAL</span>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className={isActive("/staff/dashboard")} onClick={() => navigate("/staff/dashboard")}>
            <span className="icon">🏠</span> Dashboard
          </li>
          <li className={isActive("/staff/pos")} onClick={() => navigate("/staff/pos")}>
            <span className="icon">🛒</span> POS
          </li>
          <li className={isActive("/staff/inventory")} onClick={() => navigate("/staff/inventory")}>
            <span className="icon">📦</span> Inventory
          </li>
          <li className={isActive("/staff/transactions")} onClick={() => navigate("/staff/transactions")}>
            <span className="icon">🧾</span> Transactions
          </li>
          <li className={isActive("/staff/attendance")} onClick={() => navigate("/staff/attendance")}>
            <span className="icon">⏱️</span> Attendance
          </li>
          {/* UPDATED SETTINGS ROUTE BELOW */}
          <li className={isActive("/staff/settings")} onClick={() => navigate("/staff/settings")}>
            <span className="icon">⚙️</span> Settings
          </li>
        </ul>
      </nav>
      <button className="logout-btn" onClick={handleLogout}>LogOut</button>
    </aside>
  );
};

export default Sidebar;
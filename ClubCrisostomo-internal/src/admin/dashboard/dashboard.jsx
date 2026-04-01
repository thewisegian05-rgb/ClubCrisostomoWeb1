import React from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css'; 

const AdminDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/');
    };

    return (
        <div className="dashboard-container">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>CLUB C.</h2>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li className="active" onClick={() => navigate('/admin')}>
                            <span className="icon">🏠</span> DashBoard
                        </li>
                        <li onClick={() => navigate('/admin/inventory')}>
                            <span className="icon">📦</span> Inventory
                        </li>
                        <li onClick={() => navigate('/admin/menu')}>
                            <span className="icon">☕</span> Menu
                        </li>
                        <li onClick={() => navigate('/admin/staffs-management')}>
                            <span className="icon">👥</span> Staff
                        </li>
                        <li onClick={() => navigate('/admin/reports')}>
                            <span className="icon">📊</span> Reports
                        </li>
                        <li onClick={() => navigate('/admin/settingsadmin')}>
                            <span className="icon">⚙️</span> Settings
                        </li>
                    </ul>
                </nav>
                <button className="logout-btn" onClick={handleLogout}>LogOut</button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <header className="top-header">
                    <h1>Welcome!</h1>
                    <div className="user-info">
                        <span className="bell-icon">🔔</span>
                        <span className="user-name">Admin 👤</span>
                    </div>
                </header>

                {/* TOP METRIC CARDS */}
                <section className="metrics-grid">
                    <div className="metric-card">
                        <div className="card-value">₱12,567</div>
                        <div className="card-label">Total Revenue</div>
                        <div className="card-trend positive">13% From Yesterday</div>
                    </div>
                    <div className="metric-card">
                        <div className="card-value">58 Orders</div>
                        <div className="card-label">4 in Queue</div>
                    </div>
                    <div className="metric-card">
                        <div className="card-value">Puto Bumbong Latte</div>
                        <div className="card-label">35 Sold Today</div>
                    </div>
                    <div className="metric-card">
                        <div className="card-label-top">Staff On Duty</div>
                        <div className="card-value small">3 Active</div>
                        <div className="card-label">1 Break</div>
                    </div>
                </section>

                {/* MAIN DASHBOARD WIDGETS */}
                <section className="widgets-grid">
                    
                    {/* LEFT COLUMN */}
                    <div className="left-column">
                        {/* CHART WIDGET */}
                        <div className="widget chart-widget">
                            <div className="widget-header">
                                <h2>Sales Overview</h2>
                                <span>Last 7 Days Revenue</span>
                            </div>
                            <div className="chart-placeholder">
                                {/* We will add Recharts here later! */}
                                <div className="mock-chart-line"></div>
                                <div className="chart-axes">
                                    <div className="y-axis">
                                        <span>₱8,000</span>
                                        <span>₱6,000</span>
                                        <span>₱4,000</span>
                                        <span>₱2,000</span>
                                    </div>
                                    <div className="x-axis">
                                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sun</span>
                                    </div>
                                </div>
                            </div>
                            <div className="chart-legend">
                                <span className="dot revenue-dot"></span> Revenue
                            </div>
                        </div>

                        {/* BOTTOM LEFT WIDGETS: STAFF & ORDER STATUS */}
                        <div className="bottom-widgets-row">
                            <div className="widget staff-widget">
                                <h2>Staff On Shift</h2>
                                <div className="staff-list">
                                    <div className="staff-item">
                                        <div className="staff-info"><strong>Kulas</strong><br/>Cashier</div>
                                        <div className="status-badge active">Active</div>
                                    </div>
                                    <div className="staff-item">
                                        <div className="staff-info"><strong>Ba2te</strong><br/>Barista</div>
                                        <div className="status-badge active">Active</div>
                                    </div>
                                    <div className="staff-item">
                                        <div className="staff-info"><strong>Juan</strong><br/>Server</div>
                                        <div className="status-badge break">Break</div>
                                    </div>
                                </div>
                            </div>

                            <div className="widget order-status-widget">
                                <h2>Order Status</h2>
                                <div className="status-list">
                                    <div className="status-item">
                                        <span className="dot yellow-dot"></span> In Queue <strong>3</strong>
                                        <span className="count-badge green">5</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="dot blue-dot"></span> Processing <strong>12</strong>
                                        <span className="count-badge blue">4</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="dot green-dot"></span> Complete <strong>55</strong>
                                        <span className="count-badge green">112</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="right-column">
                        {/* ORDER STATUS COMPACT */}
                        <div className="widget compact-status">
                            <h2>Order Status</h2>
                            <div className="status-item"><span className="dot yellow-dot"></span> In Queue <strong>3</strong></div>
                            <div className="status-item"><span className="dot blue-dot"></span> Processing <strong>12</strong></div>
                            <div className="status-item"><span className="dot green-dot"></span> Complete <strong>55</strong></div>
                        </div>

                        {/* CUSTOMER FEEDBACK */}
                        <div className="widget feedback-widget">
                            <h2>Customer Feedback</h2>
                            <div className="feedback-card">
                                <div className="stars">⭐⭐⭐⭐⭐ <span className="time">5mins ago</span></div>
                                <p>Fast service and great coffee.</p>
                            </div>
                            <div className="feedback-card">
                                <div className="stars">⭐⭐⭐⭐⭐ <span className="time">2h ago</span></div>
                                <p>Nice ambiance but waiting time is long.</p>
                            </div>
                        </div>

                        {/* SMART INSIGHTS */}
                        <div className="widget insights-widget">
                            <h2>Smart Insight</h2>
                            <div className="insight-row">
                                <span>Tomorrow Forecast</span>
                                <strong>₱12,123</strong>
                            </div>
                            <div className="insight-row">
                                <span>Expect Peak</span>
                                <strong>5PM - 7PM</strong>
                            </div>
                        </div>
                    </div>

                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
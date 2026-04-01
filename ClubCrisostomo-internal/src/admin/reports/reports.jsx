import React from 'react';
import { useNavigate } from 'react-router-dom';
import './reports.css';

// Mock Data for the Tables
const RESTOCKING_DATA = [
    { id: 1, item: "Espresso Beans", current: "9kg", recommended: "9kg", cost: "P4,000" },
    { id: 2, item: "Milk", current: "5L", recommended: "5L", cost: "P1,200" },
    { id: 3, item: "Sugar", current: "2kg", recommended: "2kg", cost: "P300" }
];

const STAFF_SALARY_DATA = [
    { id: 1, staff: "Kulas", role: "Cashier", hours: "120hrs", salary: "P15,000" },
    { id: 2, staff: "Ba2te", role: "Barista", hours: "130hrs", salary: "P13,200" },
    { id: 3, staff: "Juan", role: "Server", hours: "100hrs", salary: "P14,300" }
];

const Reports = () => {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        navigate(path);
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
                        <li onClick={() => handleNavigation('/admin')}><span className="icon">🏠</span> DashBoard</li>
                        <li onClick={() => handleNavigation('/admin/inventory')}><span className="icon">📦</span> Inventory</li>
                        <li onClick={() => handleNavigation('/admin/menu')}><span className="icon">☕</span> Menu</li>
                        <li onClick={() => handleNavigation('/admin/staffs-management')}><span className="icon">👥</span> Staff</li>
                        <li className="active"><span className="icon">📊</span> Reports</li>
                        <li onClick={() => handleNavigation('/admin/settingsadmin')}><span className="icon">⚙️</span> Settings</li>
                    </ul>
                </nav>
                <button className="logout-btn" onClick={() => handleNavigation('/')}>LogOut</button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <header className="reports-header">
                    <h1>Reports</h1>
                </header>

                {/* TOP METRICS ROW */}
                <div className="reports-metrics-grid">
                    <div className="report-metric-card">
                        <div className="metric-label"><span className="dot grey-dot"></span> Total Revenue</div>
                        <div className="metric-value">P181,312</div>
                    </div>
                    <div className="report-metric-card">
                        <div className="metric-label"><span className="dot grey-dot"></span> Total Sales</div>
                        <div className="metric-value">3,789</div>
                    </div>
                    <div className="report-metric-card">
                        <div className="metric-label"><span className="dot grey-dot"></span> Profit</div>
                        <div className="metric-value text-green">P50,123</div>
                    </div>
                    <div className="report-metric-card">
                        <div className="metric-label"><span className="dot grey-dot"></span> Expenses</div>
                        <div className="metric-value text-red">P102,123</div>
                    </div>
                </div>

                {/* CHART WIDGET */}
                <div className="reports-chart-widget widget">
                    <div className="chart-header">
                        <h2>Sales vs. Profit</h2>
                        <div className="chart-legend-top">
                            <span><span className="dot gold-dot"></span> Sales</span>
                            <span><span className="dot muted-dot"></span> Profit</span>
                        </div>
                    </div>
                    
                    {/* Placeholder for the actual line chart (e.g., Recharts) */}
                    <div className="chart-area-placeholder">
                        <div className="mock-chart-lines">
                            {/* Visual representation of a chart for design purposes */}
                            <svg viewBox="0 0 800 200" className="mock-svg">
                                <path d="M 50 150 Q 200 100, 350 120 T 600 50 T 750 130" fill="none" stroke="var(--text-accent)" strokeWidth="3" />
                                <path d="M 50 180 Q 200 140, 350 150 T 600 100 T 750 150" fill="none" stroke="#888" strokeWidth="3" />
                                
                                <circle cx="50" cy="150" r="5" fill="var(--bg-dark)" stroke="var(--text-accent)" strokeWidth="2" />
                                <circle cx="350" cy="120" r="5" fill="var(--bg-dark)" stroke="var(--text-accent)" strokeWidth="2" />
                                <circle cx="600" cy="50" r="5" fill="var(--bg-dark)" stroke="var(--text-accent)" strokeWidth="2" />
                                <circle cx="750" cy="130" r="5" fill="var(--bg-dark)" stroke="var(--text-accent)" strokeWidth="2" />
                                
                                <circle cx="50" cy="180" r="5" fill="var(--bg-dark)" stroke="#888" strokeWidth="2" />
                                <circle cx="350" cy="150" r="5" fill="var(--bg-dark)" stroke="#888" strokeWidth="2" />
                                <circle cx="600" cy="100" r="5" fill="var(--bg-dark)" stroke="#888" strokeWidth="2" />
                                <circle cx="750" cy="150" r="5" fill="var(--bg-dark)" stroke="#888" strokeWidth="2" />
                            </svg>
                        </div>
                        <div className="chart-axes">
                            <div className="y-axis">
                                <span>P40k</span>
                                <span>P30k</span>
                                <span>P20k</span>
                                <span>P10k</span>
                                <span>0</span>
                            </div>
                            <div className="x-axis">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sun</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM TABLES ROW */}
                <div className="reports-tables-grid">
                    
                    {/* RESTOCKING OVERVIEW */}
                    <div className="widget table-widget">
                        <h2>Restocking Overview</h2>
                        <div className="table-container">
                            <div className="table-header">
                                <div className="col-items">Items</div>
                                <div className="col-center">Current Stock</div>
                                <div className="col-center">Recommended Stock</div>
                                <div className="col-right">Cost</div>
                            </div>
                            <div className="table-body">
                                {RESTOCKING_DATA.map((row) => (
                                    <div className="table-row" key={row.id}>
                                        <div className="col-items">{row.item}</div>
                                        <div className="col-center">{row.current}</div>
                                        <div className="col-center">{row.recommended}</div>
                                        <div className="col-right">{row.cost}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="table-footer">
                                <div className="col-items">Total</div>
                                <div className="col-right">P5,500</div>
                            </div>
                        </div>
                    </div>

                    {/* STAFF SALARY OVERVIEW */}
                    <div className="widget table-widget">
                        <h2>Staff Salary Overview</h2>
                        <div className="table-container">
                            <div className="table-header">
                                <div className="col-staff">Staff</div>
                                <div className="col-role">Role</div>
                                <div className="col-center">Hours Work</div>
                                <div className="col-right">Salary</div>
                            </div>
                            <div className="table-body">
                                {STAFF_SALARY_DATA.map((row) => (
                                    <div className="table-row" key={row.id}>
                                        <div className="col-staff">{row.staff}</div>
                                        <div className="col-role">{row.role}</div>
                                        <div className="col-center">{row.hours}</div>
                                        <div className="col-right">{row.salary}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="table-footer">
                                <div className="col-staff"></div>
                                <div className="col-role">Total Salary</div>
                                <div className="col-right">P40,500</div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Reports;
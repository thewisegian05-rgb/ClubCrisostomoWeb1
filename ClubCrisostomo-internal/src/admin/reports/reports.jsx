import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, onSnapshot } from 'firebase/firestore';
import './reports.css';

// Mock Data for Restocking (Leave this static until you build an expenses database)
const INITIAL_RESTOCKING_DATA = [
    { id: 1, item: "Espresso Beans", current: "9kg", recommended: "9kg", cost: "₱4,000" },
    { id: 2, item: "Milk", current: "5L", recommended: "5L", cost: "₱1,200" },
    { id: 3, item: "Sugar", current: "2kg", recommended: "2kg", cost: "₱300" }
];

const Reports = () => {
    const navigate = useNavigate();

    // --- REAL-TIME DATA STATES ---
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalSales, setTotalSales] = useState(0);
    
    // Table States
    const [restockingData, setRestockingData] = useState(INITIAL_RESTOCKING_DATA);
    const [salaryData, setSalaryData] = useState([]); // <-- Now starts empty and waits for Firebase

    const handleNavigation = (path) => {
        navigate(path);
    };

    // Helper function to convert currency strings into real math numbers
    const parseCurrency = (str) => {
        if (!str && str !== 0) return 0;
        return parseFloat(String(str).replace(/[^\d.-]/g, ''));
    };

    // Calculate table totals
    const totalRestockCost = restockingData.reduce((sum, item) => sum + parseCurrency(item.cost), 0);
    const totalSalaryCost = salaryData.reduce((sum, staff) => sum + (staff.rawSalary || 0), 0); // <-- Uses the calculated raw salary
    const totalExpenses = totalRestockCost + totalSalaryCost;

    // Calculate real profit
    const profit = totalRevenue - totalExpenses;

    useEffect(() => {
        // 1. Listen to Firebase Transactions for Revenue & Sales
        const txnsCollectionRef = collection(db, 'transactions');
        const unsubscribeTxns = onSnapshot(txnsCollectionRef, (snapshot) => {
            const txns = snapshot.docs.map(doc => doc.data());
            
            // Only count "Completed" orders for sales and revenue
            const completedOrders = txns.filter(t => t.status === 'Completed');
            
            setTotalSales(completedOrders.length);
            
            const revenueSum = completedOrders.reduce((sum, t) => sum + parseCurrency(t.total), 0);
            setTotalRevenue(revenueSum);
        });

        // 2. Listen to Firebase Staff for Payroll (NEW)
        const staffCollectionRef = collection(db, 'staff');
        const unsubscribeStaff = onSnapshot(staffCollectionRef, (snapshot) => {
            const staffList = snapshot.docs.map(doc => {
                const data = doc.data();
                
                // Ensure numbers exist, default to 0 if you haven't added them in Firebase yet
                const hours = parseFloat(data.totalHours) || 0;
                const rate = parseFloat(data.hourlyRate) || 0;
                const calculatedSalary = hours * rate;

                return {
                    id: doc.id,
                    staff: data.name || "Unknown",
                    role: data.role || "Staff",
                    hours: `${hours}hrs`,
                    rawSalary: calculatedSalary, // Keep the raw number for the Total Expenses math
                    salary: `₱${calculatedSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` // Formatted for the table
                };
            });
            
            setSalaryData(staffList);
        });

        // Cleanup listeners when leaving the page
        return () => {
            unsubscribeTxns();
            unsubscribeStaff();
        };
    }, []);

    return (
        <div className="dashboard-container">
            {/* --- ADMIN SIDEBAR --- */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2 style={{ color: '#c8a27c', margin: '20px 0', fontSize: '24px', letterSpacing: '1px' }}>CLUB C.</h2>
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
                <header className="page-header">
                    <div className="header-titles">
                        <h1>Reports & Analytics</h1>
                        <p>View your sales performance, expenses, and staff payroll.</p>
                    </div>
                </header>

                {/* TOP METRICS ROW */}
                <div className="metrics-grid">
                    <div className="metric-card">
                        <span className="metric-title"><span className="dot dot-grey"></span> Total Revenue</span>
                        <span className="metric-value">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-title"><span className="dot dot-grey"></span> Total Sales</span>
                        <span className="metric-value">{totalSales.toLocaleString()}</span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-title"><span className="dot dot-green"></span> Profit</span>
                        <span className={`metric-value ${profit >= 0 ? 'metric-value-green' : 'metric-value-red'}`}>
                            ₱{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="metric-card">
                        <span className="metric-title"><span className="dot dot-red"></span> Expenses</span>
                        <span className="metric-value metric-value-red">₱{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* CHART WIDGET */}
                <div className="widget chart-widget" style={{marginBottom: '20px'}}>
                    <div className="chart-header">
                        <h2>Sales vs. Profit</h2>
                        <div className="chart-legend-top">
                            <span><span className="dot gold-dot"></span> Sales</span>
                            <span><span className="dot muted-dot"></span> Profit</span>
                        </div>
                    </div>
                    
                    <div className="chart-area-placeholder">
                        <div className="mock-chart-lines">
                            <svg viewBox="0 0 800 200" className="mock-svg" preserveAspectRatio="none">
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
                                <span>₱40k</span>
                                <span>₱30k</span>
                                <span>₱20k</span>
                                <span>₱10k</span>
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
                                <div className="col-center">Current</div>
                                <div className="col-center">Recommended</div>
                                <div className="col-right">Cost</div>
                            </div>
                            <div className="table-body">
                                {restockingData.map((row) => (
                                    <div className="table-row" key={row.id}>
                                        <div className="col-items">{row.item}</div>
                                        <div className="col-center">{row.current}</div>
                                        <div className="col-center">{row.recommended}</div>
                                        <div className="col-right">{row.cost}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="table-footer">
                                <div className="col-items">Total Cost</div>
                                <div className="col-right" style={{color: '#ef5350'}}>
                                    ₱{totalRestockCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
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
                                <div className="col-center">Hours</div>
                                <div className="col-right">Salary</div>
                            </div>
                            <div className="table-body">
                                {salaryData.length === 0 ? (
                                    <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No staff data found.</div>
                                ) : (
                                    salaryData.map((row) => (
                                        <div className="table-row" key={row.id}>
                                            <div className="col-staff">{row.staff}</div>
                                            <div className="col-role" style={{color: 'var(--text-muted)'}}>{row.role}</div>
                                            <div className="col-center">{row.hours}</div>
                                            <div className="col-right text-gold">{row.salary}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="table-footer">
                                <div className="col-staff"></div>
                                <div className="col-role">Total Payroll</div>
                                <div className="col-right" style={{color: '#ef5350'}}>
                                    ₱{totalSalaryCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Reports;
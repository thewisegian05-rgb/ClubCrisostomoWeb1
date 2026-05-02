import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; 
import { collection, onSnapshot } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    const [chartData, setChartData] = useState([]);
    
    // Table States
    const [restockingData, setRestockingData] = useState(INITIAL_RESTOCKING_DATA);
    const [salaryData, setSalaryData] = useState([]); // <-- Now starts empty and waits for Firebase

    const handleNavigation = (path) => {
        navigate(path);
    };

    // Helper function to convert currency strings into real math numbers
    const parseCurrency = (str) => {
        if (str === null || str === undefined || str === '') return 0;
        return parseFloat(String(str).replace(/[^\d.-]/g, '')) || 0;
    };

    const getAmount = (value) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseCurrency(value);
        return 0;
    };

    // Calculate table totals
    const totalRestockCost = restockingData.reduce((sum, item) => sum + parseCurrency(item.cost), 0);
    const totalSalaryCost = salaryData.reduce((sum, staff) => sum + (staff.rawSalary || 0), 0); // <-- Uses the calculated raw salary
    const totalExpenses = totalRestockCost + totalSalaryCost;

    // Calculate real profit
    const profit = totalRevenue - totalExpenses;

    useEffect(() => {
        // Helper to get last 7 days
        const getLast7Days = () => {
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                days.push(date.toISOString().split('T')[0]); // YYYY-MM-DD
            }
            return days;
        };

        const last7Days = getLast7Days();

        const normalizeTimestampToDateString = (createdAt) => {
            if (!createdAt) return null;
            let dateObj = null;

            if (createdAt.toDate) {
                dateObj = createdAt.toDate();
            } else if (typeof createdAt === 'number') {
                dateObj = new Date(createdAt);
            } else if (typeof createdAt === 'string') {
                dateObj = new Date(createdAt);
            } else if (createdAt instanceof Date) {
                dateObj = createdAt;
            }

            if (!dateObj || Number.isNaN(dateObj.getTime())) return null;
            return dateObj.toISOString().split('T')[0];
        };

        // 1. Listen to Firebase Orders for Revenue & Sales
        const txnsCollectionRef = collection(db, 'orders');
        const unsubscribeTxns = onSnapshot(txnsCollectionRef, (snapshot) => {
            const txns = snapshot.docs.map(doc => doc.data());
            
            // Only count "Completed" orders for revenue and sales
            const completedOrders = txns.filter(t => String(t.status).toLowerCase() === 'completed');
            
            const revenueSum = completedOrders.reduce((sum, t) => sum + getAmount(t.totalAmount), 0);
            setTotalRevenue(revenueSum);
            setTotalSales(completedOrders.length);

            // Group by date for chart
            const dailyData = {};
            last7Days.forEach(day => {
                dailyData[day] = { orderCount: 0, revenue: 0 };
            });

            completedOrders.forEach(order => {
                const date = normalizeTimestampToDateString(order.createdAt);
                if (date && dailyData[date]) {
                    dailyData[date].orderCount += 1;
                    dailyData[date].revenue += getAmount(order.totalAmount);
                }
            });

            // Calculate daily profit: revenue - (totalExpenses / 7)
            const dailyExpense = totalExpenses / 7;
            const chartDataArray = last7Days.map(day => ({
                day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
                sales: dailyData[day].revenue,
                orders: dailyData[day].orderCount,
                profit: dailyData[day].revenue - dailyExpense
            }));
            setChartData(chartDataArray);
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
    }, [totalExpenses]); // Depend on totalExpenses to recalculate profit

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
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis
                                    stroke="var(--text-muted)"
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                    tickLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                                    interval={0}
                                    domain={[0, 'dataMax + 100']}
                                    label={{ value: 'Amount (₱)', angle: -90, position: 'insideLeft', dy: 20, fill: 'var(--text-muted)' }}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--widget-dark)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    labelStyle={{ color: 'var(--text-main)' }}
                                    itemStyle={{ color: 'var(--text-accent)' }}
                                />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="sales" stroke="var(--text-accent)" strokeWidth={3} name="Sales (₱)" />
                                <Line yAxisId="left" type="monotone" dataKey="profit" stroke="#888" strokeWidth={3} name="Profit (₱)" />
                            </LineChart>
                        </ResponsiveContainer>
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
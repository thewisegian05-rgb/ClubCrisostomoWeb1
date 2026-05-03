import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css'; 
import { db } from '../../firebase'; // Firebase connection
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
    const navigate = useNavigate();

    // --- REAL-TIME DATA STATES ---
    const [revenue, setRevenue] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [queueCount, setQueueCount] = useState(0);
    const [processingCount, setProcessingCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [voidedCount, setVoidedCount] = useState(0); 
    
    const [bestSeller, setBestSeller] = useState({ name: 'N/A', count: 0 });
    const [topItemsList, setTopItemsList] = useState([]); 
    
    const [staffData, setStaffData] = useState([]);
    const [activeStaffCount, setActiveStaffCount] = useState(0);
    const [breakStaffCount, setBreakStaffCount] = useState(0);
    
    const [sevenDayData, setSevenDayData] = useState([]);

    // --- MODAL STATES ---
    const [showRevenueModal, setShowRevenueModal] = useState(false);
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [showBestSellersModal, setShowBestSellersModal] = useState(false);

    const [tallyDetails, setTallyDetails] = useState({
        completedCount: 0,
        payoutCount: 0,
        completedRevenue: 0,
        voidedRevenue: 0,
        totalPayouts: 0,
        expectedCash: 0,
        dineInRevenue: 0,
        takeoutRevenue: 0
    });

    const handleLogout = () => {
        navigate('/');
    };

    const parseCurrency = (str) => {
        if (!str) return 0;
        return parseFloat(String(str).replace(/[^\d.-]/g, ''));
    };

    useEffect(() => {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Listen to Orders
        const ordersCollectionRef = collection(db, 'orders');
        const unsubscribeOrders = onSnapshot(ordersCollectionRef, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Filter by Status
            const pending = orders.filter(t => t.status === 'Pending');
            const preparing = orders.filter(t => t.status === 'Preparing');
            const completed = orders.filter(t => t.status === 'Completed');
            const voided = orders.filter(t => t.status === 'Voided');
            const payouts = orders.filter(t => t.status === 'Payout');

            // ALL-TIME order counts (for queues, etc.)
            const allQueueCount = pending.length;
            const allProcessingCount = preparing.length;
            const allCompletedCount = completed.length;
            const allVoidedCount = voided.length;
            const allTotalOrders = orders.filter(t => t.status !== 'Payout').length;

            // --- FILTER ORDERS FOR TODAY ONLY ---
            const todayOrders = orders.filter(t => { 
                if (!t.createdAt) return false;
                let orderDate = t.createdAt;
                if (orderDate.toDate) orderDate = orderDate.toDate();
                else if (typeof orderDate === 'string') orderDate = new Date(orderDate);
                
                return orderDate >= today && orderDate < tomorrow;
            });

            const todayCompleted = todayOrders.filter(t => t.status === 'Completed');
            const todayPending = todayOrders.filter(t => t.status === 'Pending');
            const todayPreparing = todayOrders.filter(t => t.status === 'Preparing');
            const todayVoided = todayOrders.filter(t => t.status === 'Voided');

            // Set TODAY'S metric card values
            setQueueCount(todayPending.length);
            setProcessingCount(todayPreparing.length);
            setCompletedCount(todayCompleted.length);
            setVoidedCount(todayVoided.length);
            setTotalOrders(todayOrders.filter(t => t.status !== 'Payout').length);

            // Calculate Today's Revenue (Completed orders only for today)
            const todayRev = todayCompleted.reduce((sum, t) => sum + parseCurrency(t.totalAmount), 0);
            setRevenue(todayRev);

            // --- CALCULATE 7-DAY REVENUE DATA ---
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                
                const dayRevenue = completed
                    .filter(t => {
                        if (!t.createdAt) return false;
                        let txnDate = t.createdAt;
                        if (txnDate.toDate) txnDate = txnDate.toDate();
                        else if (typeof txnDate === 'string') txnDate = new Date(txnDate);
                        
                        return txnDate >= date && txnDate < nextDate;
                    })
                    .reduce((sum, t) => sum + parseCurrency(t.totalAmount), 0);
                
                last7Days.push({
                    day: dayName,
                    revenue: dayRevenue,
                    fullDate: date.toLocaleDateString()
                });
            }
            setSevenDayData(last7Days);

            // --- CALCULATE TALLY DETAILS FOR MODAL (ALL TIME) ---
            const voidedRev = voided.reduce((sum, t) => sum + parseCurrency(t.totalAmount), 0);
            const totalOut = payouts.reduce((sum, t) => sum + Math.abs(parseCurrency(t.totalAmount)), 0);
            
            const allCompletedRev = completed.reduce((sum, t) => sum + parseCurrency(t.totalAmount), 0);
            
            setTallyDetails({
                completedCount: completed.length,
                payoutCount: payouts.length,
                completedRevenue: allCompletedRev,
                voidedRevenue: voidedRev,
                totalPayouts: totalOut,
                expectedCash: allCompletedRev - totalOut,
                dineInRevenue: completed.filter(t => t.orderType !== 'Takeout').reduce((sum, t) => sum + parseCurrency(t.totalAmount), 0),
                takeoutRevenue: completed.filter(t => t.orderType === 'Takeout').reduce((sum, t) => sum + parseCurrency(t.totalAmount), 0)
            });

            // --- CALCULATE TODAY'S BEST SELLERS (TODAY ONLY) ---
            const itemCounts = {};
            todayCompleted.forEach(t => {
                if (!t.items || !Array.isArray(t.items)) return;
                
                t.items.forEach(item => {
                    if (!item.name) return;
                    
                    const itemName = item.name.trim();
                    const quantity = item.quantity || 1;
                    
                    if (itemName) {
                        itemCounts[itemName] = (itemCounts[itemName] || 0) + quantity;
                    }
                });
            });

            // Convert to array and sort highest to lowest
            const sortedItems = Object.entries(itemCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            setTopItemsList(sortedItems);

            if (sortedItems.length > 0) {
                setBestSeller(sortedItems[0]);
            } else {
                setBestSeller({ name: 'No sales yet', count: 0 });
            }
        });

        // 2. Listen to Staff Attendance
        const staffCollectionRef = collection(db, 'staff');
        const unsubscribeStaff = onSnapshot(staffCollectionRef, (snapshot) => {
            const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const onShiftStaff = staffList.filter(s => s.status === 'Active' || s.status === 'On Break');
            const active = staffList.filter(s => s.status === 'Active');
            const onBreak = staffList.filter(s => s.status === 'On Break' || s.status === 'Break');

            setStaffData(onShiftStaff);
            setActiveStaffCount(active.length);
            setBreakStaffCount(onBreak.length);
        });

        // Cleanup listeners
        return () => {
            unsubscribeOrders();
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
                    {/* Revenue Card */}
                    <div 
                        className="metric-card" 
                        onClick={() => setShowRevenueModal(true)} 
                        style={{ cursor: 'pointer', transition: 'transform 0.2s ease', border: '1px solid transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.border = '1px solid var(--text-accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.border = '1px solid transparent'}
                    >
                        <div className="card-value">₱{revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="card-label">Total Revenue</div>
                        <div className="card-trend positive" style={{ textDecoration: 'underline' }}>Click to view Tally Details</div>
                    </div>
                    
                    {/* Orders Card */}
                    <div 
                        className="metric-card"
                        onClick={() => setShowOrdersModal(true)} 
                        style={{ cursor: 'pointer', transition: 'transform 0.2s ease', border: '1px solid transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.border = '1px solid var(--text-accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.border = '1px solid transparent'}
                    >
                        <div className="card-value">{totalOrders} Orders</div>
                        <div className="card-label">{queueCount} in Queue</div>
                        <div className="card-trend positive" style={{ textDecoration: 'underline', color: 'var(--text-muted)', marginTop: '5px' }}>Click to view full breakdown</div>
                    </div>

                    {/* Best Seller Card */}
                    <div 
                        className="metric-card"
                        onClick={() => setShowBestSellersModal(true)} 
                        style={{ cursor: 'pointer', transition: 'transform 0.2s ease', border: '1px solid transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.border = '1px solid var(--text-accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.border = '1px solid transparent'}
                    >
                        <div className="card-value" style={{ fontSize: bestSeller.name.length > 15 ? '1.1rem' : '1.5rem', lineHeight: '1.2' }}>
                            {bestSeller.name}
                        </div>
                        <div className="card-label">{bestSeller.count} Sold</div>
                        <div className="card-trend positive" style={{ textDecoration: 'underline', color: 'var(--text-muted)', marginTop: '5px' }}>Click to view top items list</div>
                    </div>

                    <div className="metric-card">
                        <div className="card-label-top">Staff On Duty</div>
                        <div className="card-value small">{activeStaffCount} Active</div>
                        <div className="card-label">{breakStaffCount} Break</div>
                    </div>
                </section>

                {/* MAIN DASHBOARD WIDGETS */}
                <section className="widgets-grid">
                    
                    {/* LEFT COLUMN */}
                    <div className="left-column">
                        {/* CHART WIDGET (Static Placeholder) */}
                        <div className="widget chart-widget">
                            <div className="widget-header">
                                <h2>Sales Overview</h2>
                                <span>Last 7 Days Revenue</span>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={sevenDayData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis 
                                        dataKey="day" 
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    />
                                    <YAxis 
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                        label={{ value: 'Revenue (₱)', angle: -90, position: 'insideLeft', offset: -5, fill: '#888' }}
                                    />
                                    <Tooltip 
                                        formatter={(value) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        contentStyle={{
                                            backgroundColor: '#1a1a1a',
                                            border: '1px solid #c8a27c',
                                            borderRadius: '8px',
                                            color: '#c8a27c'
                                        }}
                                    />
                                    <Bar 
                                        dataKey="revenue" 
                                        fill="#c8a27c" 
                                        radius={[8, 8, 0, 0]}
                                        name="Revenue"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* BOTTOM LEFT WIDGETS: STAFF & ORDER STATUS */}
                        <div className="bottom-widgets-row">
                            <div className="widget staff-widget">
                                <h2>Staff On Shift</h2>
                                <div className="staff-list">
                                    {staffData.length === 0 ? (
                                        <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px'}}>No staff currently clocked in.</div>
                                    ) : (
                                        staffData.map(staff => (
                                            <div className="staff-item" key={staff.id}>
                                                <div className="staff-info"><strong>{staff.name}</strong><br/>{staff.role}</div>
                                                <div className={`status-badge ${staff.status === 'Active' ? 'active' : 'break'}`}>
                                                    {staff.status === 'Active' ? 'Active' : 'Break'}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="widget order-status-widget">
                                <h2>Order Status</h2>
                                <div className="status-list">
                                    <div className="status-item">
                                        <span className="dot yellow-dot"></span> In Queue
                                        <span className="count-badge" style={{backgroundColor: '#fbc02d', color: '#000'}}>{queueCount}</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="dot blue-dot"></span> Processing
                                        <span className="count-badge blue">{processingCount}</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="dot green-dot"></span> Complete
                                        <span className="count-badge green">{completedCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="right-column">
                        {/* ORDER STATUS COMPACT */}
                        <div className="widget compact-status">
                            <h2>Live Queue Status</h2>
                            <div className="status-item"><span className="dot yellow-dot"></span> In Queue <strong>{queueCount}</strong></div>
                            <div className="status-item"><span className="dot blue-dot"></span> Processing <strong>{processingCount}</strong></div>
                            <div className="status-item"><span className="dot green-dot"></span> Complete <strong>{completedCount}</strong></div>
                        </div>

                        {/* CUSTOMER FEEDBACK (Static Placeholder) */}
                        <div className="widget feedback-widget">
                            <h2>Customer Feedback</h2>
                            <div className="feedback-card">
                                <div className="stars">⭐⭐⭐⭐⭐ <span className="time">5mins ago</span></div>
                                <p>Fast service and great coffee.</p>
                            </div>
                            <div className="feedback-card">
                                <div className="stars">⭐⭐⭐⭐ <span className="time">2h ago</span></div>
                                <p>Nice ambiance but waiting time is long.</p>
                            </div>
                        </div>

                        {/* SMART INSIGHTS (Static Placeholder) */}
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

            {/* --- REVENUE TALLY MODAL --- */}
            {showRevenueModal && (
                <div className="modal-overlay" onClick={() => setShowRevenueModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-dark)', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                            <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem' }}>📊 Revenue Tally Details</h2>
                            <button onClick={() => setShowRevenueModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ backgroundColor: "rgba(200, 162, 124, 0.1)", border: "1px solid var(--text-accent)", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
                                <h3 style={{ color: "var(--text-accent)", margin: "0 0 10px 0", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px" }}>Expected Cash In Drawer</h3>
                                <div style={{ color: "var(--text-accent)", fontSize: "2.5rem", fontWeight: "bold" }}>
                                    ₱{tallyDetails.expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div style={{ backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "15px" }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px dashed rgba(255,255,255,0.1)', marginBottom: '10px' }}>
                                    <span style={{ color: 'var(--text-main)' }}>Total Gross Sales</span>
                                    <span style={{ color: "#4caf50", fontWeight: "bold" }}>+ ₱{tallyDetails.completedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px dashed rgba(255,255,255,0.1)', marginBottom: '10px' }}>
                                    <span style={{ color: 'var(--text-main)' }}>Total Cash Paid Out</span>
                                    <span style={{ color: "#ef5350", fontWeight: "bold" }}>- ₱{tallyDetails.totalPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: "0.85rem", color: 'var(--text-muted)' }}>
                                    <span>Completed Orders: {tallyDetails.completedCount}</span>
                                    <span>Payouts Recorded: {tallyDetails.payoutCount}</span>
                                </div>
                            </div>

                            <div style={{ padding: "0 10px" }}>
                                <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0 0 10px 0", textTransform: "uppercase" }}>Order Breakdown</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-main)' }}>Dine-In</span>
                                    <span style={{ color: 'var(--text-main)' }}>₱{tallyDetails.dineInRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-main)' }}>Takeout</span>
                                    <span style={{ color: 'var(--text-main)' }}>₱{tallyDetails.takeoutRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {tallyDetails.voidedRevenue > 0 && (
                                <div style={{ backgroundColor: "rgba(239, 83, 80, 0.05)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(239, 83, 80, 0.2)", display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: "#ef5350", fontSize: "0.9rem" }}>Voided Revenue</span>
                                    <span style={{ color: "#ef5350", fontWeight: "bold", fontSize: "0.9rem" }}>₱{tallyDetails.voidedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- ORDERS BREAKDOWN MODAL --- */}
            {showOrdersModal && (
                <div className="modal-overlay" onClick={() => setShowOrdersModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-dark)', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                            <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem' }}>🧾 Orders Breakdown</h2>
                            <button onClick={() => setShowOrdersModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "15px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span className="dot green-dot"></span><span style={{ color: 'var(--text-main)' }}>Completed</span></div>
                                <span style={{ color: "#4caf50", fontWeight: "bold", fontSize: "1.2rem" }}>{completedCount}</span>
                            </div>

                            <div style={{ backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "15px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span className="dot blue-dot"></span><span style={{ color: 'var(--text-main)' }}>Processing (Preparing)</span></div>
                                <span style={{ color: "#2196f3", fontWeight: "bold", fontSize: "1.2rem" }}>{processingCount}</span>
                            </div>

                            <div style={{ backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "15px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span className="dot yellow-dot"></span><span style={{ color: 'var(--text-main)' }}>In Queue (Pending)</span></div>
                                <span style={{ color: "#fbc02d", fontWeight: "bold", fontSize: "1.2rem" }}>{queueCount}</span>
                            </div>

                            <div style={{ backgroundColor: "rgba(239, 83, 80, 0.05)", borderRadius: "8px", padding: "15px", display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: "1px solid rgba(239, 83, 80, 0.2)" }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span className="dot red-dot"></span><span style={{ color: '#ef5350' }}>Voided / Cancelled</span></div>
                                <span style={{ color: "#ef5350", fontWeight: "bold", fontSize: "1.2rem" }}>{voidedCount}</span>
                            </div>

                            <div style={{ marginTop: '10px', textAlign: 'center', padding: '15px 0', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Total Tracked Orders: </span>
                                <strong style={{ color: 'var(--text-accent)', fontSize: '1.2rem' }}>{totalOrders}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- BEST SELLERS MODAL --- */}
            {showBestSellersModal && (
                <div className="modal-overlay" onClick={() => setShowBestSellersModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-dark)', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                            <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem' }}>🏆 Top Selling Items</h2>
                            <button onClick={() => setShowBestSellersModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                            {topItemsList.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No items sold yet today.</div>
                            ) : (
                                topItemsList.map((item, index) => (
                                    <div key={index} style={{ 
                                        backgroundColor: index === 0 ? "rgba(200, 162, 124, 0.1)" : "rgba(0,0,0,0.3)", 
                                        border: index === 0 ? "1px solid var(--text-accent)" : "1px solid transparent",
                                        borderRadius: "8px", 
                                        padding: "12px 15px", 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center' 
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ 
                                                color: index === 0 ? 'var(--text-accent)' : 'var(--text-muted)', 
                                                fontWeight: 'bold',
                                                width: '20px'
                                            }}>#{index + 1}</span>
                                            <span style={{ color: index === 0 ? 'var(--text-accent)' : 'var(--text-main)', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                                                {item.name}
                                            </span>
                                        </div>
                                        <span style={{ color: index === 0 ? 'var(--text-accent)' : '#fff', fontWeight: "bold" }}>
                                            {item.count} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.7 }}>sold</span>
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;
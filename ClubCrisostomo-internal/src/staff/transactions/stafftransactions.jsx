import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar.jsx';
import './stafftransactions.css';
import { db } from '../../firebase'; // <-- Fixed import path
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const StaffTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedTxn, setSelectedTxn] = useState(null);
    
    // --- SHIFT REPORT STATE ---
    const [showShiftReport, setShowShiftReport] = useState(false);

    // Fetch data from Firebase in real-time
    useEffect(() => {
        const txnsCollectionRef = collection(db, 'transactions'); // Make sure your Firestore collection is named 'transactions'
        
        // onSnapshot listens for real-time changes in the database
        const unsubscribe = onSnapshot(txnsCollectionRef, (snapshot) => {
            const txnsData = snapshot.docs.map(doc => ({
                id: doc.id, // Using the Firebase document ID
                ...doc.data()
            }));
            setTransactions(txnsData);
        }, (error) => {
            console.error("Error fetching transactions: ", error);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, []);

    // Update status directly in Firebase
    const changeStatus = async (e, id, newStatus) => {
        e.stopPropagation();
        try {
            const txnDocRef = doc(db, 'transactions', id);
            await updateDoc(txnDocRef, { status: newStatus });
            // Note: We don't need to manually update state here because onSnapshot will automatically detect the change and update the UI.
        } catch (error) {
            console.error("Error updating status: ", error);
            alert("Failed to update status. Please try again.");
        }
    };

    const handleViewReceipt = (txn) => {
        setSelectedTxn(txn);
        setActiveModal("receipt");
    };

    // Filter Queues
    const pendingTxns = transactions.filter(t => t.status === 'Pending');
    const preparingTxns = transactions.filter(t => t.status === 'Preparing');
    const historyTxns = transactions.filter(t => ['Completed', 'Voided', 'Payout'].includes(t.status));

    // --- END OF SHIFT TALLY CALCULATIONS ---
    const completedTxns = historyTxns.filter(t => t.status === 'Completed');
    const voidedTxns = historyTxns.filter(t => t.status === 'Voided');
    const payoutTxns = historyTxns.filter(t => t.status === 'Payout');

    const parseCurrency = (str) => {
        if (!str) return 0;
        return parseFloat(String(str).replace(/[^\d.-]/g, ''));
    };

    const completedRevenue = completedTxns.reduce((sum, t) => sum + parseCurrency(t.total), 0);
    const voidedRevenue = voidedTxns.reduce((sum, t) => sum + parseCurrency(t.total), 0);
    const totalPayouts = payoutTxns.reduce((sum, t) => sum + Math.abs(parseCurrency(t.total)), 0); 
    
    // Gross sales minus cash taken out = what should be in the register.
    const expectedCashInDrawer = completedRevenue - totalPayouts;

    const dineInRevenue = completedTxns.filter(t => t.orderType !== 'Takeout').reduce((sum, t) => sum + parseCurrency(t.total), 0);
    const takeoutRevenue = completedTxns.filter(t => t.orderType === 'Takeout').reduce((sum, t) => sum + parseCurrency(t.total), 0);

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>Transactions & Receipts 🧾</h1>
                    <button className="shift-report-btn" onClick={() => setShowShiftReport(true)}>
                        📊 End of Shift Tally
                    </button>
                </header>

                <div className="transactions-layout">
                    
                    {/* --- 1. PENDING QUEUE --- */}
                    <div className="widget" style={{ padding: 0, overflow: "hidden", marginBottom: "20px" }}>
                        <div style={{ padding: "15px 20px", backgroundColor: "rgba(239, 83, 80, 0.1)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <h2 style={{ margin: 0, color: "#ef5350", fontSize: "1.2rem" }}>🚨 New Orders (Pending)</h2>
                        </div>
                        <div className="table-header">
                            <div style={{flex: 1}}>Receipt ID</div>
                            <div style={{flex: 1}}>Time / Staff</div>
                            <div style={{flex: 2}}>Items Summary</div>
                            <div style={{flex: 1, textAlign: "center"}}>Actions</div>
                        </div>
                        <div className="table-body">
                            {pendingTxns.length === 0 ? <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No pending orders.</div> : (
                                pendingTxns.map(txn => (
                                    <div className="table-row clickable-row" key={txn.id} onClick={() => handleViewReceipt(txn)}>
                                        <div style={{flex: 1}}>
                                            <div style={{color: "var(--text-accent)", fontWeight: "bold"}}>{txn.id}</div>
                                            <span className={`order-badge ${txn.orderType === 'Takeout' ? 'badge-takeout' : 'badge-dinein'}`}>{txn.orderType || 'Dine In'}</span>
                                        </div>
                                        <div style={{flex: 1}}><div>{txn.time}</div><div className="text-muted" style={{fontSize: "0.8rem"}}>By: {txn.staff}</div></div>
                                        <div style={{flex: 2, color: "var(--text-muted)", paddingRight: "20px"}}>{txn.items}</div>
                                        <div style={{flex: 1, display: "flex", gap: "8px", justifyContent: "center"}}>
                                            <button className="prepare-btn" onClick={(e) => changeStatus(e, txn.id, 'Preparing')}>Prepare</button>
                                            <button className="void-btn" onClick={(e) => changeStatus(e, txn.id, 'Voided')}>Void</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* --- 2. NOW PREPARING --- */}
                    <div className="widget" style={{ padding: 0, overflow: "hidden", marginBottom: "20px" }}>
                        <div style={{ padding: "15px 20px", backgroundColor: "rgba(212, 163, 115, 0.1)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <h2 style={{ margin: 0, color: "var(--text-accent)", fontSize: "1.2rem" }}>👨‍🍳 Now Preparing</h2>
                        </div>
                        <div className="table-header">
                            <div style={{flex: 1}}>Receipt ID</div>
                            <div style={{flex: 1}}>Time / Staff</div>
                            <div style={{flex: 2}}>Items Summary</div>
                            <div style={{flex: 1, textAlign: "center"}}>Action</div>
                        </div>
                        <div className="table-body">
                            {preparingTxns.length === 0 ? <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Nothing is being prepared right now.</div> : (
                                preparingTxns.map(txn => (
                                    <div className="table-row clickable-row" key={txn.id} onClick={() => handleViewReceipt(txn)}>
                                        <div style={{flex: 1}}>
                                            <div style={{color: "var(--text-accent)", fontWeight: "bold"}}>{txn.id}</div>
                                            <span className={`order-badge ${txn.orderType === 'Takeout' ? 'badge-takeout' : 'badge-dinein'}`}>{txn.orderType || 'Dine In'}</span>
                                        </div>
                                        <div style={{flex: 1}}><div>{txn.time}</div><div className="text-muted" style={{fontSize: "0.8rem"}}>By: {txn.staff}</div></div>
                                        <div style={{flex: 2, color: "var(--text-muted)", paddingRight: "20px"}}>{txn.items}</div>
                                        <div style={{flex: 1, display: "flex", justifyContent: "center"}}>
                                            <button className="complete-btn" onClick={(e) => changeStatus(e, txn.id, 'Completed')}>Done</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* --- 3. HISTORY --- */}
                    <div className="widget" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ padding: "15px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Transaction History</h2>
                        </div>
                        <div className="table-header">
                            <div style={{flex: 1}}>Receipt ID</div>
                            <div style={{flex: 1}}>Time / Staff</div>
                            <div style={{flex: 2}}>Items Summary</div>
                            <div style={{flex: 1}}>Status</div>
                            <div style={{flex: 1, textAlign: "right"}}>Total</div>
                        </div>
                        <div className="table-body history-table-body">
                            {historyTxns.length === 0 ? <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>No transaction history yet.</div> : (
                                historyTxns.map(txn => (
                                    <div className="table-row clickable-row" key={txn.id} onClick={() => handleViewReceipt(txn)}>
                                        <div style={{flex: 1}}>
                                            <div style={{color: "var(--text-muted)", fontWeight: "bold"}}>{txn.id}</div>
                                            {/* Hide badge for Payouts */}
                                            {txn.status !== 'Payout' && (
                                                <span className={`order-badge ${txn.orderType === 'Takeout' ? 'badge-takeout' : 'badge-dinein'}`} style={{ opacity: 0.6 }}>
                                                    {txn.orderType || 'Dine In'}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{flex: 1}}><div>{txn.time}</div><div className="text-muted" style={{fontSize: "0.8rem"}}>By: {txn.staff}</div></div>
                                        <div style={{flex: 2, color: "var(--text-muted)", paddingRight: "20px"}}>{txn.items}</div>
                                        <div style={{flex: 1}}>
                                            {/* Style payout badge differently */}
                                            <span className={`status-badge ${txn.status === 'Completed' ? 'badge-good' : txn.status === 'Payout' ? 'badge-warning' : 'badge-critical'}`}>
                                                {txn.status}
                                            </span>
                                        </div>
                                        <div style={{flex: 1, textAlign: "right", fontWeight: "bold", fontSize: "1.1rem", color: txn.status === 'Payout' ? '#ef5350' : 'var(--text-main)'}}>{txn.total}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </main>

            {/* --- RECEIPT MODAL --- */}
            {activeModal === "receipt" && selectedTxn && (
                <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="modal-content receipt-card" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setActiveModal(null)}>✖</button>
                        <div className="receipt-header">
                            <h2>CLUB C.</h2>
                            <p className="text-muted">Transaction: {selectedTxn.id}</p>
                            <p className="text-muted">{selectedTxn.time} | Cashier: {selectedTxn.staff}</p>
                            {selectedTxn.status !== 'Payout' && (
                                <p style={{fontWeight: "bold", marginTop: "5px", color: "var(--text-accent)"}}>
                                    {selectedTxn.orderType ? selectedTxn.orderType.toUpperCase() : 'DINE IN'}
                                </p>
                            )}
                        </div>
                        
                        <div className="receipt-items">
                            <p>{selectedTxn.items?.split(' | ').map((item, i) => <span key={i} style={{display: "block", marginBottom: "5px"}}>{item}</span>)}</p>
                        </div>
                        
                        <div className="receipt-total">
                            <span>Total</span>
                            <span style={{ color: selectedTxn.status === 'Payout' ? '#ef5350' : 'var(--text-accent)' }}>{selectedTxn.total}</span>
                        </div>
                        
                        <div style={{display: "flex", gap: "10px", marginTop: "20px"}}>
                            <button className="modal-action-btn outline" style={{flex: 1}}>Print Copy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- END OF SHIFT REPORT MODAL --- */}
            {showShiftReport && (
                <div className="modal-overlay" onClick={() => setShowShiftReport(false)}>
                    <div className="modal-content report-card" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowShiftReport(false)}>✖</button>
                        
                        <div className="report-header">
                            <h2>📊 End of Shift Tally</h2>
                            <p className="text-muted">Generated: {new Date().toLocaleString()}</p>
                        </div>

                        <div className="report-body">
                            
                            {/* Expected Cash in Drawer */}
                            <div className="report-section summary-box" style={{backgroundColor: "rgba(200, 162, 124, 0.1)", borderColor: "var(--text-accent)"}}>
                                <h3 style={{ color: "var(--text-accent)", marginBottom: "10px" }}>Expected Cash In Drawer</h3>
                                <div className="report-huge-total" style={{color: "var(--text-accent)"}}>₱{expectedCashInDrawer.toFixed(2)}</div>
                            </div>

                            {/* Sales & Payouts Breakdown */}
                            <div className="report-section">
                                <div className="report-row">
                                    <span>Total Gross Sales</span>
                                    <span style={{color: "#4caf50", fontWeight: "bold"}}>+ ₱{completedRevenue.toFixed(2)}</span>
                                </div>
                                <div className="report-row" style={{borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "10px", marginBottom: "5px"}}>
                                    <span>Total Cash Paid Out</span>
                                    <span style={{color: "#ef5350", fontWeight: "bold"}}>- ₱{totalPayouts.toFixed(2)}</span>
                                </div>
                                <div className="report-row text-muted" style={{fontSize: "0.85rem"}}>
                                    <span>Completed Orders: {completedTxns.length}</span>
                                    <span>Payouts Recorded: {payoutTxns.length}</span>
                                </div>
                            </div>

                            {/* Revenue Breakdown */}
                            <div className="report-section">
                                <h3 style={{ color: "var(--text-accent)", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "10px", fontSize: "0.9rem" }}>Sales Breakdown</h3>
                                <div className="report-row">
                                    <span>Dine-In</span>
                                    <span>₱{dineInRevenue.toFixed(2)}</span>
                                </div>
                                <div className="report-row">
                                    <span>Takeout</span>
                                    <span>₱{takeoutRevenue.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Voided Details */}
                            <div className="report-section" style={{ backgroundColor: "rgba(239, 83, 80, 0.05)", padding: "10px 15px", borderRadius: "8px", border: "1px solid rgba(239, 83, 80, 0.2)" }}>
                                <div className="report-row" style={{padding: 0}}>
                                    <span style={{ color: "#ef5350", fontSize: "0.9rem" }}>Voided Revenue</span>
                                    <span style={{ color: "#ef5350", fontWeight: "bold", fontSize: "0.9rem" }}>₱{voidedRevenue.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{display: "flex", gap: "10px", marginTop: "25px"}}>
                            <button className="modal-action-btn outline" style={{flex: 1}} onClick={() => setShowShiftReport(false)}>Close</button>
                            <button className="modal-action-btn" style={{flex: 2}}>Print Z-Reading</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default StaffTransactions;
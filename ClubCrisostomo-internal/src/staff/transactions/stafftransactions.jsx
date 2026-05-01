import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar.jsx';
import './stafftransactions.css';
import { db } from '../../firebase'; 
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const StaffTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedTxn, setSelectedTxn] = useState(null);
    
    // --- SHIFT REPORT STATE ---
    const [showShiftReport, setShowShiftReport] = useState(false);

    // Fetch data from Firebase in real-time
    useEffect(() => {
        const txnsCollectionRef = collection(db, 'orders'); 
        
        const unsubscribe = onSnapshot(txnsCollectionRef, (snapshot) => {
            const txnsData = snapshot.docs.map(doc => {
                const data = doc.data();
                
                const itemsSummary = Array.isArray(data.items) 
                    ? data.items.map(item => `${item.quantity || 1}x ${item.name}`).join(', ')
                    : data.items || "No items";

                const timeString = data.createdAt?.toDate 
                    ? data.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : "Just now";

                return {
                    id: doc.id,
                    receiptId: data.receiptId || doc.id, 
                    time: timeString,
                    customerName: data.customerName || "Walk-in",
                    itemsString: itemsSummary, 
                    itemsArray: data.items || [], 
                    totalAmount: parseFloat(data.totalAmount || 0), 
                    totalFormatted: `₱${parseFloat(data.totalAmount || 0).toFixed(2)}`,
                    status: data.status || "Pending",
                    orderType: data.address ? "Delivery" : (data.tableNumber ? "Dine In" : "Takeout"),
                    paymentMethod: data.paymentMethod || "Cash",
                    address: data.address || "",
                    contactNumber: data.contactNumber || "",
                    landmark: data.landmark || "",
                    // Add createdAt for accurate FIFO sorting
                    createdAt: data.createdAt?.toMillis() || 0,
                    ...data
                };
            });
            setTransactions(txnsData);
        }, (error) => {
            console.error("Error fetching transactions: ", error);
        });

        return () => unsubscribe();
    }, []);

    // Update status directly in Firebase
    const changeStatus = async (e, id, newStatus) => {
        e.stopPropagation();
        try {
            const txnDocRef = doc(db, 'orders', id);
            await updateDoc(txnDocRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating status: ", error);
            alert("Failed to update status. Please try again.");
        }
    };

    const handleViewReceipt = (txn) => {
        setSelectedTxn(txn);
        setActiveModal("receipt");
    };

    // --- FILTER QUEUES BASED ON NEW LOGIC ---
    const pendingTxns = transactions.filter(t => t.status === 'Pending'); 
    
    // Split Pending into Priority (Delivery & Takeout) and Others (Dine In) 
    // AND apply FIFO sorting (oldest first)
    const priorityOrders = pendingTxns
        .filter(t => t.orderType === 'Delivery' || t.orderType === 'Takeout')
        .sort((a, b) => a.createdAt - b.createdAt); // FIFO

    const standardPending = pendingTxns
        .filter(t => t.orderType !== 'Delivery' && t.orderType !== 'Takeout')
        .sort((a, b) => a.createdAt - b.createdAt); // FIFO
    
    // --- UPDATED PREPARING QUEUE LOGIC ---
    const preparingTxnsUnsorted = transactions.filter(t => t.status === 'Preparing'); 
    
    // Sort preparingTxns: 
    // 1. Prioritize Delivery/Takeout over Dine In
    // 2. Then apply FIFO based on createdAt
    const preparingTxns = [...preparingTxnsUnsorted].sort((a, b) => {
        const isAPriority = a.orderType === 'Delivery' || a.orderType === 'Takeout';
        const isBPriority = b.orderType === 'Delivery' || b.orderType === 'Takeout';

        if (isAPriority && !isBPriority) {
            return -1; // a comes first
        }
        if (!isAPriority && isBPriority) {
            return 1;  // b comes first
        }
        
        // If both are the same priority level, sort by time (FIFO)
        return a.createdAt - b.createdAt; 
    });
    
    // History queue - Sorted newest to oldest (Reverse FIFO)
    const historyTxns = transactions
        .filter(t => ['To Receive', 'Completed', 'Voided', 'Payout'].includes(t.status))
        .sort((a, b) => b.createdAt - a.createdAt);

    // --- END OF SHIFT TALLY CALCULATIONS ---
    const completedTxns = historyTxns.filter(t => t.status === 'Completed');
    const voidedTxns = historyTxns.filter(t => t.status === 'Voided');
    const payoutTxns = historyTxns.filter(t => t.status === 'Payout');

    const completedRevenue = completedTxns.reduce((sum, t) => sum + t.totalAmount, 0);
    const voidedRevenue = voidedTxns.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalPayouts = payoutTxns.reduce((sum, t) => sum + Math.abs(t.totalAmount), 0); 
    
    const expectedCashInDrawer = completedRevenue - totalPayouts;

    const dineInRevenue = completedTxns.filter(t => t.orderType !== 'Takeout' && t.orderType !== 'Delivery').reduce((sum, t) => sum + t.totalAmount, 0);
    const takeoutRevenue = completedTxns.filter(t => t.orderType === 'Takeout' || t.orderType === 'Delivery').reduce((sum, t) => sum + t.totalAmount, 0);

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

                    {/* --- PRIORITY ALERT: PENDING DELIVERIES & TAKEOUT --- */}
                    {priorityOrders.length > 0 && (
                        <div className="widget" style={{ padding: 0, overflow: "hidden", marginBottom: "20px", border: "1px solid #C8A27C", backgroundColor: "rgba(200, 162, 124, 0.05)" }}>
                            <div style={{ padding: "15px 20px", borderBottom: "1px solid rgba(200, 162, 124, 0.2)" }}>
                                <h2 style={{ margin: 0, color: "#C8A27C", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                                    ⚠️ PRIORITY ORDERS ({priorityOrders.length})
                                </h2>
                            </div>
                            <div className="table-header" style={{ opacity: 0.8 }}>
                                <div style={{flex: 1}}>Receipt ID</div>
                                <div style={{flex: 1}}>Time / Customer</div>
                                <div style={{flex: 2}}>Items Summary</div>
                                <div style={{flex: 1, textAlign: "center"}}>Actions</div>
                            </div>
                            <div className="table-body">
                                {priorityOrders.map(txn => (
                                    <div className="table-row clickable-row" key={txn.id} onClick={() => handleViewReceipt(txn)}>
                                        <div style={{flex: 1}}>
                                            <div style={{color: "var(--text-accent)", fontWeight: "bold"}}>{txn.receiptId}</div>
                                            <span className={`order-badge ${txn.orderType === 'Dine In' ? 'badge-dinein' : 'badge-takeout'}`}>{txn.orderType}</span>
                                        </div>
                                        <div style={{flex: 1}}>
                                            <div>{txn.time}</div>
                                            <div className="text-muted" style={{fontSize: "0.8rem"}}>Customer: {txn.customerName}</div>
                                        </div>
                                        <div style={{flex: 2, color: "var(--text-muted)", paddingRight: "20px"}}>{txn.itemsString}</div>
                                        <div style={{flex: 1, display: "flex", gap: "8px", justifyContent: "center"}}>
                                            <button className="prepare-btn" style={{borderColor: '#C8A27C', color: '#C8A27C'}} onClick={(e) => changeStatus(e, txn.id, 'Preparing')}>Accept</button>
                                            <button className="void-btn" onClick={(e) => changeStatus(e, txn.id, 'Voided')}>Decline</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* --- 1. PENDING APPROVAL QUEUE (DINE IN) --- */}
                    <div className="widget" style={{ padding: 0, overflow: "hidden", marginBottom: "20px" }}>
                        <div style={{ padding: "15px 20px", backgroundColor: "rgba(239, 83, 80, 0.1)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <h2 style={{ margin: 0, color: "#ef5350", fontSize: "1.2rem" }}>🚨 Pending Approval (Dine-In)</h2>
                        </div>
                        <div className="table-header">
                            <div style={{flex: 1}}>Receipt ID</div>
                            <div style={{flex: 1}}>Time / Customer</div>
                            <div style={{flex: 2}}>Items Summary</div>
                            <div style={{flex: 1, textAlign: "center"}}>Actions</div>
                        </div>
                        <div className="table-body">
                            {standardPending.length === 0 ? <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No pending orders.</div> : (
                                standardPending.map(txn => (
                                    <div className="table-row clickable-row" key={txn.id} onClick={() => handleViewReceipt(txn)}>
                                        <div style={{flex: 1}}>
                                            <div style={{color: "var(--text-accent)", fontWeight: "bold"}}>{txn.receiptId}</div>
                                            <span className={`order-badge ${txn.orderType === 'Dine In' ? 'badge-dinein' : 'badge-takeout'}`}>{txn.orderType}</span>
                                        </div>
                                        <div style={{flex: 1}}>
                                            <div>{txn.time}</div>
                                            <div className="text-muted" style={{fontSize: "0.8rem"}}>Customer: {txn.customerName}</div>
                                        </div>
                                        <div style={{flex: 2, color: "var(--text-muted)", paddingRight: "20px"}}>{txn.itemsString}</div>
                                        <div style={{flex: 1, display: "flex", gap: "8px", justifyContent: "center"}}>
                                            <button className="prepare-btn" onClick={(e) => changeStatus(e, txn.id, 'Preparing')}>Accept</button>
                                            <button className="void-btn" onClick={(e) => changeStatus(e, txn.id, 'Voided')}>Decline</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* --- 2. NOW PREPARING --- */}
                    <div className="widget" style={{ padding: 0, overflow: "hidden", marginBottom: "20px" }}>
                        <div style={{ padding: "15px 20px", backgroundColor: "rgba(212, 163, 115, 0.1)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <h2 style={{ margin: 0, color: "var(--text-accent)", fontSize: "1.2rem" }}>👨‍🍳 Now Preparing (To Ship)</h2>
                        </div>
                        <div className="table-header">
                            <div style={{flex: 1}}>Receipt ID</div>
                            <div style={{flex: 1}}>Time / Customer</div>
                            <div style={{flex: 2}}>Items Summary</div>
                            <div style={{flex: 1, textAlign: "center"}}>Action</div>
                        </div>
                        <div className="table-body">
                            {preparingTxns.length === 0 ? <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Nothing is being prepared right now.</div> : (
                                preparingTxns.map(txn => (
                                    <div className="table-row clickable-row" key={txn.id} onClick={() => handleViewReceipt(txn)}>
                                        <div style={{flex: 1}}>
                                            <div style={{color: "var(--text-accent)", fontWeight: "bold"}}>{txn.receiptId}</div>
                                            <span className={`order-badge ${txn.orderType === 'Dine In' ? 'badge-dinein' : 'badge-takeout'}`}>{txn.orderType}</span>
                                        </div>
                                        <div style={{flex: 1}}>
                                            <div>{txn.time}</div>
                                            <div className="text-muted" style={{fontSize: "0.8rem"}}>Customer: {txn.customerName}</div>
                                        </div>
                                        <div style={{flex: 2, color: "var(--text-muted)", paddingRight: "20px"}}>{txn.itemsString}</div>
                                        <div style={{flex: 1, display: "flex", justifyContent: "center"}}>
                                            <button className="complete-btn" onClick={(e) => changeStatus(e, txn.id, 'To Receive')}>Done Preparing</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* --- 3. HISTORY --- */}
                    <div className="widget" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ padding: "15px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Transaction History & Fulfillment</h2>
                        </div>
                        <div className="table-header">
                            <div style={{flex: 1}}>Receipt ID</div>
                            <div style={{flex: 1}}>Time / Customer</div>
                            <div style={{flex: 2}}>Items Summary</div>
                            <div style={{flex: 1}}>Status</div>
                            <div style={{flex: 1, textAlign: "right"}}>Total</div>
                        </div>
                        <div className="table-body history-table-body">
                            {historyTxns.length === 0 ? <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>No transaction history yet.</div> : (
                                historyTxns.map(txn => (
                                    <div className="table-row clickable-row" key={txn.id} onClick={() => handleViewReceipt(txn)}>
                                        <div style={{flex: 1}}>
                                            <div style={{color: "var(--text-muted)", fontWeight: "bold"}}>{txn.receiptId}</div>
                                            {txn.status !== 'Payout' && (
                                                <span className={`order-badge ${txn.orderType === 'Dine In' ? 'badge-dinein' : 'badge-takeout'}`} style={{ opacity: 0.6 }}>
                                                    {txn.orderType}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{flex: 1}}>
                                            <div>{txn.time}</div>
                                            <div className="text-muted" style={{fontSize: "0.8rem"}}>Customer: {txn.customerName}</div>
                                        </div>
                                        <div style={{flex: 2, color: "var(--text-muted)", paddingRight: "20px"}}>{txn.itemsString}</div>
                                        
                                        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                                            <span className={`status-badge ${txn.status === 'Completed' ? 'badge-good' : txn.status === 'To Receive' ? 'badge-warning' : 'badge-critical'}`}>
                                                {txn.status}
                                            </span>
                                            {/* Safety fail-safe: If customer forgets to click "Received", Staff can force it to Completed */}
                                            {txn.status === 'To Receive' && (
                                                <button 
                                                    onClick={(e) => changeStatus(e, txn.id, 'Completed')} 
                                                    style={{ marginTop: '5px', background: 'none', border: '1px solid #4caf50', color: '#4caf50', borderRadius: '4px', fontSize: '0.7rem', padding: '2px 5px', cursor: 'pointer'}}
                                                >
                                                    Force Complete
                                                </button>
                                            )}
                                        </div>

                                        <div style={{flex: 1, textAlign: "right", fontWeight: "bold", fontSize: "1.1rem", color: txn.status === 'Payout' ? '#ef5350' : 'var(--text-main)'}}>
                                            {txn.totalFormatted}
                                        </div>
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
                            <p className="text-muted">Transaction: {selectedTxn.receiptId}</p>
                            <p className="text-muted">{selectedTxn.time} | Customer: {selectedTxn.customerName}</p>
                            {selectedTxn.status !== 'Payout' && (
                                <p style={{fontWeight: "bold", marginTop: "5px", color: "var(--text-accent)"}}>
                                    {selectedTxn.orderType.toUpperCase()}
                                </p>
                            )}
                        </div>
                        
                        {selectedTxn.orderType === "Delivery" && (
                            <div style={{ background: "#252525", padding: "15px", borderRadius: "8px", margin: "15px 0", textAlign: "left", border: "1px solid #333" }}>
                                <strong style={{ color: "#C8A27C", display: "block", marginBottom: "5px" }}>Delivery Details:</strong>
                                <div style={{ fontSize: "0.9rem", color: "#ddd" }}>
                                    <p style={{ margin: "2px 0" }}>📞 {selectedTxn.contactNumber}</p>
                                    <p style={{ margin: "2px 0" }}>📍 {selectedTxn.address}</p>
                                    {selectedTxn.landmark && <p style={{ margin: "2px 0", color: "#aaa" }}><em>Landmark: {selectedTxn.landmark}</em></p>}
                                </div>
                            </div>
                        )}
                        
                        <div className="receipt-items" style={{ textAlign: "left", marginTop: "15px" }}>
                            {Array.isArray(selectedTxn.itemsArray) ? selectedTxn.itemsArray.map((item, i) => (
                                <div key={i} style={{ marginBottom: "10px", borderBottom: "1px dashed #333", paddingBottom: "10px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <strong>{item.quantity || 1}x {item.name}</strong>
                                        <span>₱{item.total}</span>
                                    </div>
                                    {item.addons && item.addons.length > 0 && (
                                        <div style={{ color: "#aaa", fontSize: "0.8rem", paddingLeft: "20px", marginTop: "4px" }}>
                                            {item.addons.map((addon, aIdx) => (
                                                <div key={aIdx}>+ {addon.qty} {addon.name}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )) : <p>{selectedTxn.itemsString}</p>}
                        </div>
                        
                        <div className="receipt-total" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", fontSize: "1.2rem", fontWeight: "bold" }}>
                            <span>Total</span>
                            <span style={{ color: selectedTxn.status === 'Payout' ? '#ef5350' : 'var(--text-accent)' }}>
                                {selectedTxn.totalFormatted}
                            </span>
                        </div>
                        <div style={{ textAlign: "center", color: "#aaa", fontSize: "0.85rem", marginTop: "10px" }}>
                            Payment Method: {selectedTxn.paymentMethod}
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
                            <div className="report-section summary-box" style={{backgroundColor: "rgba(200, 162, 124, 0.1)", borderColor: "var(--text-accent)"}}>
                                <h3 style={{ color: "var(--text-accent)", marginBottom: "10px" }}>Expected Cash In Drawer</h3>
                                <div className="report-huge-total" style={{color: "var(--text-accent)"}}>₱{expectedCashInDrawer.toFixed(2)}</div>
                            </div>

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

                            <div className="report-section">
                                <h3 style={{ color: "var(--text-accent)", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "10px", fontSize: "0.9rem" }}>Sales Breakdown</h3>
                                <div className="report-row">
                                    <span>Dine-In</span>
                                    <span>₱{dineInRevenue.toFixed(2)}</span>
                                </div>
                                <div className="report-row">
                                    <span>Delivery & Takeout</span>
                                    <span>₱{takeoutRevenue.toFixed(2)}</span>
                                </div>
                            </div>

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
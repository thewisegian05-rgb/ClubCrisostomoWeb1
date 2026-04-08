import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar.jsx';
import './staffinventory.css';
import { db } from '../../firebase'; // Firebase connection
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';

const StaffInventory = () => {
    // --- 1. CLOUD STATE (Replaced localStorage) ---
    const [inventory, setInventory] = useState([]);
    const [logs, setLogs] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeTab, setActiveTab] = useState('Counter'); 
    
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false); 
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false); 
    const [selectedItem, setSelectedItem] = useState(null);

    const [updateAmount, setUpdateAmount] = useState('');
    const [updateReason, setUpdateReason] = useState('Shift Tally');
    const [updateLocation, setUpdateLocation] = useState('Counter'); 
    
    const [receiveAmount, setReceiveAmount] = useState(''); 
    const [receiveBaseline, setReceiveBaseline] = useState(''); 

    // --- 2. FETCH DATA FROM FIREBASE IN REAL-TIME ---
    useEffect(() => {
        // Sync Inventory
        const invCollection = collection(db, 'inventory');
        const unsubscribeInv = onSnapshot(invCollection, (snapshot) => {
            const invData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setInventory(invData);
        });

        // Sync Logs (Creating a new collection in your database just for logs)
        const logsCollection = collection(db, 'inventoryLogs');
        const logsQuery = query(logsCollection, orderBy('timestamp', 'desc'), limit(50));
        const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setLogs(logsData);
        });

        return () => {
            unsubscribeInv();
            unsubscribeLogs();
        };
    }, []);

    // --- SMART REASON TOGGLER ---
    useEffect(() => {
        if (isUpdateModalOpen && selectedItem) {
            const currentAmt = updateLocation === 'Counter' ? (parseFloat(selectedItem.quantity) || 0) : (parseFloat(selectedItem.backStock) || 0);
            const newAmt = parseFloat(updateAmount);
            const diff = isNaN(newAmt) ? 0 : newAmt - currentAmt;
            
            let validReasons = [];
            if (diff > 0) {
                validReasons = updateLocation === 'Backroom' ? ['Delivery', 'Correction'] : ['Correction'];
            } else {
                validReasons = ['Shift Tally', 'Expired', 'Spilled/Wasted', 'Staff Meal', 'Correction'];
            }
                
            if (!validReasons.includes(updateReason)) {
                setUpdateReason(validReasons[0]);
            }
        }
    }, [updateAmount, updateLocation, isUpdateModalOpen, selectedItem]);

    // Save Logs to Firebase instead of LocalStorage
    const createLog = async (itemName, category, qtyChange, actionType, details) => {
        try {
            await addDoc(collection(db, 'inventoryLogs'), {
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
                itemName,
                category,
                qtyChange,
                actionType,
                details
            });
        } catch (error) {
            console.error("Error creating log:", error);
        }
    };

    // Calculate percentage and status so the Admin sees the correct color tags
    const recalculateStatus = (qty, baseline) => {
        const currentQty = parseFloat(qty) || 0;
        const base = parseFloat(baseline) || 1;
        const percentage = Math.min(100, Math.max(0, (currentQty / base) * 100));
        
        let status = "Ample";
        let colorClass = "status-green";

        if (percentage <= 20) {
            status = "Critical";
            colorClass = "status-red";
        } else if (percentage <= 50) {
            status = "Low stock";
            colorClass = "status-yellow";
        }
        return { stockPercentage: percentage, status, colorClass };
    };

    // --- 3. CLOUD UPDATE FUNCTIONS ---
    const handleQuickAdjust = async (id, location, delta) => {
        const item = inventory.find(i => i.id === id);
        if (!item) return;

        try {
            const itemRef = doc(db, 'inventory', id);
            
            if (location === 'Counter') {
                const newQty = Math.max(0, (parseFloat(item.quantity) || 0) + delta);
                const actualDelta = newQty - (parseFloat(item.quantity) || 0);
                if (actualDelta !== 0) {
                    createLog(item.name, item.category, actualDelta > 0 ? `+${actualDelta} qty` : `${actualDelta} qty`, actualDelta > 0 ? "Correction" : "Shift Tally", "Quick Adjust");
                    const calcs = recalculateStatus(newQty, item.baseline);
                    await updateDoc(itemRef, { quantity: newQty, ...calcs });
                }
            } else {
                const newBackStock = Math.max(0, (parseFloat(item.backStock) || 0) + delta);
                const actualDelta = newBackStock - (parseFloat(item.backStock) || 0);
                if (actualDelta !== 0) {
                    createLog(item.name, item.category, actualDelta > 0 ? `+${actualDelta} pkgs` : `${actualDelta} pkgs`, actualDelta > 0 ? "Correction" : "Shift Tally", "Quick Adjust");
                    await updateDoc(itemRef, { backStock: newBackStock });
                }
            }
        } catch (error) {
            console.error("Error updating quick adjust:", error);
        }
    };

    const handleMarkOut = async (id) => {
        const item = inventory.find(i => i.id === id);
        if (!item) return;

        try {
            createLog(item.name, item.category, `-${item.quantity} qty`, "Marked 86 Empty", "Counter cleared");
            const calcs = recalculateStatus(0, item.baseline);
            await updateDoc(doc(db, 'inventory', id), { quantity: 0, ...calcs });
        } catch (error) {
            console.error("Error marking out:", error);
        }
    };

    const openReceiveModal = (item) => {
        setSelectedItem(item);
        setReceiveAmount('');
        setReceiveBaseline(item.baseline || ''); 
        setIsReceiveModalOpen(true);
    };

    const submitReceive = async () => {
        const pkgs = parseInt(receiveAmount);
        const newBaseline = parseFloat(receiveBaseline);
        if (!pkgs || pkgs <= 0) return alert("Please enter valid packages received.");
        if (!newBaseline || newBaseline <= 0) return alert("Please enter valid quantity per package.");

        const item = inventory.find(i => i.id === selectedItem.id);
        if (!item) return;

        try {
            const oldBaseline = parseFloat(item.baseline) || 1;
            const oldBackStockPkgs = parseFloat(item.backStock) || 0;
            const oldRawTotal = oldBackStockPkgs * oldBaseline;
            const newlyArrivedRaw = pkgs * newBaseline;
            const totalRawNow = oldRawTotal + newlyArrivedRaw;
            const updatedBackStockPkgs = totalRawNow / newBaseline;
            
            createLog(item.name, item.category, `+${pkgs} pkgs`, "Delivery", `Baseline updated to ${newBaseline}`);
            await updateDoc(doc(db, 'inventory', item.id), { backStock: updatedBackStockPkgs, baseline: newBaseline });
            setIsReceiveModalOpen(false);
        } catch (error) {
            console.error("Error receiving delivery:", error);
        }
    };

    const openRestockModal = (item) => {
        setSelectedItem(item);
        setIsRestockModalOpen(true);
    };

    const confirmRestock = async () => {
        if (!selectedItem || selectedItem.backStock <= 0) return;
        const item = inventory.find(i => i.id === selectedItem.id);
        if (!item) return;

        try {
            const pkgsToMove = Math.min(1, item.backStock);
            const rawUnitsToMove = pkgsToMove * item.baseline;
            const newQty = (parseFloat(item.quantity) || 0) + rawUnitsToMove;
            const calcs = recalculateStatus(newQty, item.baseline);
            
            createLog(item.name, item.category, `+${rawUnitsToMove} qty / -${pkgsToMove} pkgs`, "Refill", "Moved to Counter");
            await updateDoc(doc(db, 'inventory', item.id), { 
                quantity: newQty, 
                backStock: item.backStock - pkgsToMove, 
                ...calcs 
            });
            setIsRestockModalOpen(false);
        } catch (error) {
            console.error("Error confirming restock:", error);
        }
    };

    const openUpdateModal = (item) => {
        setSelectedItem(item);
        setUpdateLocation(activeTab); 
        setUpdateAmount(activeTab === 'Counter' ? item.quantity : item.backStock);
        setIsUpdateModalOpen(true);
    };

    const submitUpdateLog = async () => {
        const newAmount = parseFloat(updateAmount);
        if (isNaN(newAmount) || newAmount < 0) return alert(`Please enter a valid number.`);
        const item = inventory.find(i => i.id === selectedItem.id);
        if (!item) return;

        try {
            const currentQty = updateLocation === 'Counter' ? (parseFloat(item.quantity) || 0) : (parseFloat(item.backStock) || 0);
            const difference = newAmount - currentQty;
            
            if (difference !== 0) {
                const diffText = difference > 0 ? `+${difference} ${updateLocation === 'Counter' ? 'qty' : 'pkgs'}` : `${difference} ${updateLocation === 'Counter' ? 'qty' : 'pkgs'}`;
                createLog(item.name, item.category, diffText, updateReason, `${updateLocation} Audit`);
            }

            if (updateLocation === 'Counter') {
                const calcs = recalculateStatus(newAmount, item.baseline);
                await updateDoc(doc(db, 'inventory', item.id), { quantity: newAmount, ...calcs });
            } else {
                await updateDoc(doc(db, 'inventory', item.id), { backStock: newAmount });
            }
            setIsUpdateModalOpen(false);
        } catch (error) {
            console.error("Error submitting update:", error);
        }
    };

    const categories = ['All', 'Coffee', 'Dairy', 'Syrups', 'Other'];
    const filteredInventory = inventory.filter(item => 
        (activeCategory === 'All' || item.category === activeCategory) && 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatNum = (num) => {
        if (!num && num !== 0) return 0;
        return num % 1 !== 0 ? parseFloat(num).toFixed(2) : num;
    };

    const getDifference = () => {
        if (!selectedItem || updateAmount === '') return 0;
        const newAmt = parseFloat(updateAmount);
        if (isNaN(newAmt)) return 0;
        const currentAmt = updateLocation === 'Counter' ? (parseFloat(selectedItem.quantity) || 0) : (parseFloat(selectedItem.backStock) || 0);
        return newAmt - currentAmt;
    };

    const diff = getDifference();
    let availableReasons = [];
    if (diff > 0) {
        availableReasons = updateLocation === 'Backroom' ? ['Delivery', 'Correction'] : ['Correction'];
    } else {
        availableReasons = ['Shift Tally', 'Expired', 'Spilled/Wasted', 'Staff Meal', 'Correction'];
    }

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>Inventory & Stock 📦</h1>
                    <div className="pos-search">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="Search inventory..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </header>

                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <div className="pos-categories">
                        {categories.map(cat => (
                            <button key={cat} className={`cat-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="inventory-tabs" style={{margin: 0, padding: 0, border: 'none'}}>
                        <span className={`tab ${activeTab === 'Counter' ? 'active' : ''}`} onClick={() => setActiveTab('Counter')} style={{marginRight: '20px'}}>
                            On Counter (FOH)
                        </span>
                        <span className={`tab ${activeTab === 'Backroom' ? 'active' : ''}`} onClick={() => setActiveTab('Backroom')}>
                            In Backroom (BOH)
                        </span>
                    </div>
                </div>

                <div className="widget" style={{ padding: 0, overflow: "hidden", marginBottom: "20px" }}>
                    <div className="table-header inventory-header">
                        <div style={{flex: 2.5}}>Item Name</div>
                        <div style={{flex: 1, textAlign: "center"}}>Status</div>
                        <div style={{flex: 1.5, textAlign: "center"}}>Tally Count</div>
                        <div style={{flex: 2, textAlign: "right"}}>Actions</div>
                    </div>
                    
                    <div className="table-body history-table-body" style={{maxHeight: "calc(100vh - 500px)"}}>
                        {filteredInventory.length === 0 ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No items found.</div>
                        ) : (
                            filteredInventory.map(item => {
                                const isBackroom = activeTab === 'Backroom';
                                const backQty = parseFloat(item.backStock) || 0;
                                let { status, colorClass } = recalculateStatus(item.quantity, item.baseline);
                                if (isBackroom) {
                                    if (backQty <= 1) { status = "Critical"; colorClass = "status-red"; } 
                                    else if (backQty === 2) { status = "Low stock"; colorClass = "status-yellow"; } 
                                    else { status = "Ample"; colorClass = "status-green"; }
                                }

                                const is86Allowed = backQty === 0;

                                return (
                                    <div className="table-row" key={item.id} style={{alignItems: "center"}}>
                                        <div style={{flex: 2.5}}>
                                            <div style={{fontWeight: "bold", color: "var(--text-main)", fontSize: "1rem"}}>{item.name}</div>
                                            <div style={{color: "var(--text-muted)", fontSize: "0.8rem"}}>
                                                {isBackroom ? `1 Pkg = ${item.baseline} qty` : `${item.category}`}
                                            </div>
                                        </div>
                                        <div style={{flex: 1, display: "flex", justifyContent: "center"}}>
                                            <span className={`badge ${colorClass}`} style={{padding: "4px 10px", borderRadius: "12px", fontWeight: "bold", color: "var(--bg-dark)", fontSize: "0.7rem"}}>
                                                {status}
                                            </span>
                                        </div>
                                        <div style={{flex: 1.5, display: "flex", justifyContent: "center"}}>
                                            <div className="tally-stepper">
                                                <button onClick={() => handleQuickAdjust(item.id, activeTab, -1)}>−</button>
                                                <span className="tally-value">{isBackroom ? formatNum(backQty) : formatNum(item.quantity)}</span>
                                                <button onClick={() => handleQuickAdjust(item.id, activeTab, 1)}>+</button>
                                            </div>
                                        </div>
                                        <div style={{flex: 2, display: "flex", gap: "8px", justifyContent: "flex-end"}}>
                                            {isBackroom ? (
                                                <>
                                                    <button className="inv-btn primary-action" onClick={() => openReceiveModal(item)}>📥 Log Delivery</button>
                                                    <button className="inv-btn secondary-action" onClick={() => openUpdateModal(item)}>📝 Update Count</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="inv-btn primary-action" onClick={() => openRestockModal(item)} disabled={backQty <= 0}>📦 Refill</button>
                                                    <button className="inv-btn secondary-action" onClick={() => openUpdateModal(item)}>📝 Update Count</button>
                                                    <button 
                                                        className="inv-btn danger-action" 
                                                        onClick={() => handleMarkOut(item.id)} 
                                                        disabled={parseFloat(item.quantity) <= 0 || !is86Allowed}
                                                        title={!is86Allowed ? "You cannot 86 this item because there is stock in the backroom. Please Refill instead." : ""}
                                                    >
                                                        86 Empty
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* --- LOGS SECTION --- */}
                <div className="widget" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "15px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-accent)" }}>Recent Activity Logs</h2>
                    </div>
                    <div className="table-header inventory-header" style={{backgroundColor: "rgba(0,0,0,0.3)"}}>
                        <div style={{flex: 1}}>Date / Time</div>
                        <div style={{flex: 2}}>Item / Category</div>
                        <div style={{flex: 1.5}}>Amount Changed</div>
                        <div style={{flex: 2}}>Action & Details</div>
                    </div>
                    <div className="table-body history-table-body" style={{maxHeight: "180px"}}>
                        {logs.length === 0 ? <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No recent activity.</div> : (
                            logs.map(log => (
                                <div className="table-row" key={log.id} style={{alignItems: "center", padding: "12px 20px"}}>
                                    <div style={{flex: 1}}>
                                        <div style={{color: "var(--text-main)", fontSize: "0.85rem"}}>{log.time}</div>
                                        <div style={{color: "var(--text-muted)", fontSize: "0.75rem"}}>{log.date}</div>
                                    </div>
                                    <div style={{flex: 2}}>
                                        <div style={{color: "var(--text-main)", fontWeight: "bold", fontSize: "0.95rem"}}>{log.itemName}</div>
                                        <div style={{color: "var(--text-muted)", fontSize: "0.8rem"}}>{log.category}</div>
                                    </div>
                                    <div style={{flex: 1.5, fontWeight: "bold", fontSize: "1.05rem", color: String(log.qtyChange).includes('-') ? "#ef5350" : "#81c784"}}>{log.qtyChange}</div>
                                    <div style={{flex: 2}}>
                                        <div style={{color: "var(--text-accent)", fontSize: "0.9rem", fontWeight: "bold"}}>{log.actionType}</div>
                                        <div style={{color: "var(--text-muted)", fontSize: "0.8rem"}}>{log.details}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* --- MODALS --- */}
            {isReceiveModalOpen && selectedItem && (
                <div className="modal-overlay" onClick={() => setIsReceiveModalOpen(false)}>
                    <div className="modal-content pos-custom-modal" style={{ width: "400px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom"><h2>📥 Log New Delivery</h2><button className="close-btn-custom" onClick={() => setIsReceiveModalOpen(false)}>✖</button></div>
                        <div className="modal-body-custom" style={{ padding: "20px 30px" }}>
                            <div style={{ textAlign: "center", marginBottom: "20px" }}><h3 style={{ color: "var(--text-accent)", margin: 0, fontSize: "1.3rem" }}>{selectedItem.name}</h3><p style={{ fontSize: "0.85rem", color: "var(--text-muted)"}}>Current Backroom: {formatNum(selectedItem.backStock)} pkgs</p></div>
                            <div className="form-group"><label style={{ color: "#ffffff", fontSize: "0.95rem" }}>Packages Received</label><input type="number" className="payment-input" style={{fontSize: "1.5rem", padding: "12px"}} value={receiveAmount} onChange={(e) => setReceiveAmount(e.target.value)} autoFocus /></div>
                            <div className="form-group"><label style={{ color: "#ffffff", fontSize: "0.95rem" }}>Quantity per Package</label><input type="number" className="payment-input" style={{fontSize: "1.5rem", padding: "12px"}} value={receiveBaseline} onChange={(e) => setReceiveBaseline(e.target.value)} /></div>
                        </div>
                        <div className="modal-footer-custom" style={{ justifyContent: "center", gap: "10px" }}><button className="modal-action-btn outline" style={{flex: 1}} onClick={() => setIsReceiveModalOpen(false)}>Cancel</button><button className="add-to-cart-btn" style={{ flex: 1, backgroundColor: "#2196f3", color: "#fff" }} onClick={submitReceive}>Add to Stock</button></div>
                    </div>
                </div>
            )}

            {isRestockModalOpen && selectedItem && (
                <div className="modal-overlay" onClick={() => setIsRestockModalOpen(false)}>
                    <div className="modal-content pos-custom-modal" style={{ width: "400px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom"><h2>📦 Refill Counter</h2><button className="close-btn-custom" onClick={() => setIsRestockModalOpen(false)}>✖</button></div>
                        <div className="modal-body-custom" style={{ padding: "20px 30px", textAlign: "center" }}>
                            <h3 style={{ color: "var(--text-accent)", margin: 0, fontSize: "1.3rem", marginBottom: "15px" }}>{selectedItem.name}</h3>
                            <p style={{ color: "var(--text-main)", marginBottom: "10px" }}>Move <strong>{Math.min(1, selectedItem.backStock)} pkg</strong> to counter?</p>
                            <div style={{backgroundColor: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)"}}>
                                <div style={{display: "flex", justifyContent: "space-between", marginBottom: "5px"}}><span style={{color: "var(--text-muted)"}}>Counter receives:</span><span style={{color: "#81c784", fontWeight: "bold"}}>+{Math.min(1, selectedItem.backStock) * selectedItem.baseline} qty</span></div>
                                <div style={{display: "flex", justifyContent: "space-between"}}><span style={{color: "var(--text-muted)"}}>Backroom loses:</span><span style={{color: "#ef5350", fontWeight: "bold"}}>-{Math.min(1, selectedItem.backStock)} pkg</span></div>
                            </div>
                        </div>
                        <div className="modal-footer-custom" style={{ justifyContent: "center", gap: "10px" }}><button className="modal-action-btn outline" style={{flex: 1}} onClick={() => setIsRestockModalOpen(false)}>Cancel</button><button className="add-to-cart-btn" style={{ flex: 1, backgroundColor: "#4caf50", color: "#fff" }} onClick={confirmRestock}>Confirm Refill</button></div>
                    </div>
                </div>
            )}

            {isUpdateModalOpen && selectedItem && (
                <div className="modal-overlay" onClick={() => setIsUpdateModalOpen(false)}>
                    <div className="modal-content pos-custom-modal" style={{ width: "400px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom"><h2>📝 Update Stock Count</h2><button className="close-btn-custom" onClick={() => setIsUpdateModalOpen(false)}>✖</button></div>
                        <div className="modal-body-custom" style={{ padding: "20px 30px" }}>
                            <div style={{ textAlign: "center", marginBottom: "20px" }}><h3 style={{ color: "var(--text-accent)", margin: 0, fontSize: "1.3rem" }}>{selectedItem.name}</h3></div>
                            <div className="form-group"><label style={{ color: "#ffffff", fontSize: "0.95rem", marginBottom: "8px", display: "block" }}>Updating:</label>
                                <div className="temp-toggle-container">
                                    <button className={updateLocation === 'Counter' ? 'active' : ''} onClick={() => { setUpdateLocation('Counter'); setUpdateAmount(selectedItem.quantity); }}>Counter</button>
                                    <button className={updateLocation === 'Backroom' ? 'active' : ''} onClick={() => { setUpdateLocation('Backroom'); setUpdateAmount(selectedItem.backStock); }}>Backroom</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ color: "#ffffff", fontSize: "0.95rem" }}>New Exact Quantity</label>
                                <input type="number" className="payment-input" style={{fontSize: "1.5rem", padding: "12px"}} value={updateAmount} onChange={(e) => setUpdateAmount(e.target.value)} autoFocus />
                                {diff !== 0 && <div style={{ marginTop: "8px", fontSize: "0.85rem", color: diff > 0 ? "#81c784" : "#ef5350" }}>System will {diff > 0 ? "add" : "deduct"} {Math.abs(diff)} to records.</div>}
                            </div>
                            <div className="form-group"><label style={{ color: "#ffffff", fontSize: "0.95rem", marginTop: "10px" }}>Reason</label>
                                <div className="payout-reasons-grid">
                                    {availableReasons.map(reason => (<button key={reason} className={`payout-reason-btn ${updateReason === reason ? 'active' : ''}`} onClick={() => setUpdateReason(reason)} style={reason === 'Delivery' ? {border: "1px solid #2196f3", color: updateReason === 'Delivery' ? "#fff" : "#2196f3"} : {}}>{reason}</button>))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom" style={{ justifyContent: "center", gap: "10px" }}><button className="modal-action-btn outline" style={{flex: 1}} onClick={() => setIsUpdateModalOpen(false)}>Cancel</button><button className="add-to-cart-btn" style={{ flex: 1, backgroundColor: "var(--text-accent)", color: "var(--bg-dark)", opacity: diff === 0 ? 0.5 : 1, cursor: diff === 0 ? 'not-allowed' : 'pointer' }} onClick={submitUpdateLog} disabled={diff === 0}>Confirm Update</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffInventory;
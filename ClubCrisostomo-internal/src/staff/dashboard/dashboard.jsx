import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar.jsx";
import "./dashboard.css"; 

const StaffDashboard = () => {
  const navigate = useNavigate();
  
  const [activeModal, setActiveModal] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [shiftStatus, setShiftStatus] = useState("Active"); 

  // --- DYNAMIC DATA STATES ---
  const [pendingCount, setPendingCount] = useState(0);
  const [preparingCount, setPreparingCount] = useState(0);
  const [activeOrdersList, setActiveOrdersList] = useState([]);

  // NEW: Inventory Summary States
  const [lowCounterItems, setLowCounterItems] = useState(0);
  const [lowBackroomItems, setLowBackroomItems] = useState(0);

  useEffect(() => {
      const loadData = () => {
          // 1. Process Transactions
          const savedTxns = localStorage.getItem('clubC_transactions');
          if (savedTxns) {
              const parsedTxns = JSON.parse(savedTxns);
              const pending = parsedTxns.filter(t => t.status === 'Pending');
              const preparing = parsedTxns.filter(t => t.status === 'Preparing');
              setPendingCount(pending.length);
              setPreparingCount(preparing.length);
              setActiveOrdersList([...pending, ...preparing]);
          }

          // 2. Process Inventory for Low Stock Alerts
          const savedInventory = localStorage.getItem("clubC_inventory");
          if (savedInventory) {
              const parsedInv = JSON.parse(savedInventory);
              
              // Counter Low: Anything status 'Critical' or 'Low stock'
              const counterLow = parsedInv.filter(item => item.status === 'Critical' || item.status === 'Low stock').length;
              
              // Backroom Low: Anything with 2 or less packages (based on our StaffInventory logic)
              const backroomLow = parsedInv.filter(item => (parseFloat(item.backStock) || 0) <= 2).length;

              setLowCounterItems(counterLow);
              setLowBackroomItems(backroomLow);
          }
      };

      loadData();
      window.addEventListener('storage', loadData);
      return () => window.removeEventListener('storage', loadData);
  }, []);

  const activeStaffLogs = [
    { name: "Kulas (Cashier)", status: "Active", time: "07:00 AM" },
    { name: "Ba2te (Barista)", status: "Active", time: "06:30 AM" },
    { name: "Juan (Server)", status: "Break", time: "08:00 AM" }
  ];

  const renderStatusBadge = (status) => {
    let color = "#81c784"; 
    if (status === "Break") color = "#fbc02d";
    if (status === "Offline" || status === "Pending") color = "#888";
    if (status === "Preparing") color = "#ff9800";

    return (
      <span style={{
        color: color, border: `1px solid ${color}`, borderRadius: "4px",
        padding: "3px 8px", fontSize: "0.7rem", fontWeight: "bold"
      }}>
        {status}
      </span>
    );
  };

  const renderModal = () => {
    if (!activeModal) return null;
    return (
      <div className="modal-overlay" onClick={() => setActiveModal(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setActiveModal(null)}>✖</button>
          
          {activeModal === "orders" && (
            <>
              <h2 className="modal-title">Active Orders Overview</h2>
              <div className="modal-list" style={{maxHeight: "300px", overflowY: "auto"}}>
                {activeOrdersList.length === 0 ? <div style={{textAlign: "center", color: "var(--text-muted)", padding: "20px 0"}}>No active orders!</div> : (
                    activeOrdersList.map((order, index) => (
                      <div key={index} className="modal-list-item">
                        <div style={{flex: 1}}>
                          <strong>{order.id}</strong> <span className="text-muted">• {order.time}</span>
                          <p style={{margin: "5px 0 0", fontSize: "0.9rem", color: "var(--text-muted)"}}>{order.items}</p>
                        </div>
                        {renderStatusBadge(order.status)}
                      </div>
                    ))
                )}
              </div>
              <button className="modal-action-btn" onClick={() => navigate('/staff/transactions')}>Go to Transactions</button>
            </>
          )}

          {activeModal === "stock" && (
            <>
              <h2 className="modal-title">Inventory Alerts</h2>
              <p style={{color: "var(--text-muted)", marginBottom: "15px"}}>Items requiring attention:</p>
              <div style={{textAlign: "center", padding: "20px", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "8px"}}>
                  <h3 style={{color: "var(--text-accent)"}}>{lowCounterItems} Low on Counter</h3>
                  <h3 style={{color: "#ef5350"}}>{lowBackroomItems} Low in Backroom</h3>
              </div>
              <button className="modal-action-btn" onClick={() => navigate('/staff/inventory')} style={{marginTop: "20px"}}>Manage Inventory</button>
            </>
          )}

          {activeModal === "shift" && (
            <>
              <h2 className="modal-title">Shift Management</h2>
              <div className="modal-list">
                {activeStaffLogs.map((log, index) => (
                  <div key={index} className="modal-list-item">
                    <div><strong>{log.name}</strong> <span className="text-muted" style={{fontSize: "0.8rem"}}>• In at {log.time}</span></div>
                    {renderStatusBadge(log.status)}
                  </div>
                ))}
              </div>
              <button className="modal-action-btn" onClick={() => navigate('/staff/attendance')}>Go to Attendance</button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Welcome back! ☕</h1>
          <div className="user-info">
            <span className="bell-icon">🔔</span>
            <span className="user-name">Staff 👤</span>
          </div>
        </header>

        <section className="dashboard-layout-grid">
          <div className="left-column">
            <div className="top-metrics-row">
              {/* ORDERS CARD */}
              <div className="metric-card" onClick={() => setActiveModal("orders")} style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center"}}>
                <div className="card-value" style={{color: "#ef5350", fontSize: "1.4rem"}}>{pendingCount} Pending</div>
                <div className="card-value" style={{color: "#ff9800", fontSize: "1.4rem", marginTop: "5px"}}>{preparingCount} Preparing</div>
                <div className="card-label" style={{marginTop: "10px"}}>Active Orders</div>
                <div className="card-trend positive" style={{color: "var(--text-muted)"}}>Click to view queue</div>
              </div>
              
              {/* STOCK ALERT CARD - DYNAMIC CONTENT */}
              <div className="metric-card" onClick={() => setActiveModal("stock")} style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center"}}>
                {(lowCounterItems > 0 || lowBackroomItems > 0) ? (
                    <>
                        <div className="card-value" style={{color: "#e74c3c", fontSize: "1.2rem"}}>{lowCounterItems} On Counter</div>
                        <div className="card-value" style={{color: "#e74c3c", fontSize: "1.2rem", marginTop: "5px"}}>{lowBackroomItems} Backroom</div>
                        <div className="card-label" style={{marginTop: "10px", color: "#e74c3c", fontWeight: "bold"}}>Low Stock Alerts ⚠️</div>
                    </>
                ) : (
                    <>
                        <div className="card-value" style={{color: "#81c784", fontSize: "1.8rem"}}>All Good!</div>
                        <div className="card-label" style={{marginTop: "10px"}}>Inventory is fully stocked ✅</div>
                    </>
                )}
                <div className="card-trend" style={{color: "var(--text-muted)", marginTop: "5px"}}>Click for details</div>
              </div>
            </div>

            <div className="future-widget-placeholder">
              <p>Ready for next widget (e.g., Live Order Feed)</p>
            </div>
          </div>

          <div className="right-column">
            <div className="metric-card shift-widget" onClick={() => setActiveModal("shift")}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px"}}>
                  <div className="card-label-top" style={{margin: 0}}>Your Shift</div>
                  <div style={{textAlign: "right"}}>
                      <span className="card-trend positive" style={{
                          color: isClockedIn ? "#81c784" : "#e74c3c", 
                          display: "block", fontSize: "1rem", fontWeight: "bold", margin: 0
                      }}>
                          {isClockedIn ? shiftStatus : "Clocked Out"}
                      </span>
                  </div>
              </div>
              <div style={{borderBottom: "1px solid rgba(255,255,255,0.05)", margin: "0 -20px 15px -20px"}}></div>
              <div className="preview-list">
                {activeStaffLogs.slice(0, 3).map((log, index) => (
                  <div key={index} className="preview-list-item">
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                        <div className="initial-placeholder">{log.name.charAt(0)}</div>
                        <div style={{fontSize: "0.85rem", color: "var(--text-main)"}}>{log.name}</div>
                    </div>
                    {renderStatusBadge(log.status)}
                  </div>
                ))}
              </div>
              <div className="card-trend" style={{marginTop: "15px", textAlign: "center", color: "var(--text-muted)"}}>Click to view full list</div>
            </div>
          </div>
        </section>
      </main>

      {renderModal()}
    </div>
  );
};

export default StaffDashboard;
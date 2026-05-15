import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar.jsx";
import "./dashboard.css"; 
import { db } from "../../firebase"; 
import { collection, onSnapshot } from "firebase/firestore"; 

const StaffDashboard = () => {
  const navigate = useNavigate();
  
  const [activeModal, setActiveModal] = useState(null);

  // --- DYNAMIC DATA STATES ---
  const [pendingCount, setPendingCount] = useState(0);
  const [preparingCount, setPreparingCount] = useState(0);
  const [activeOrdersList, setActiveOrdersList] = useState([]);
  
  // LIVE STAFF STATE
  const [dynamicStaffData, setDynamicStaffData] = useState([]);

  // Inventory Summary States
  const [lowCounterItems, setLowCounterItems] = useState(0);
  const [lowBackroomItems, setLowBackroomItems] = useState(0);

  // --- TO DO LIST STATE ---
  const [tasks, setTasks] = useState([
    { id: 1, text: "Clock in and review shift announcements", completed: false },
    { id: 2, text: "Check inventory alerts & restock counter", completed: false },
    { id: 3, text: "Counter check the inventory (On-counter & Backroom)", completed: false },
    { id: 4, text: "Counter check the drawer", completed: false },
    { id: 5, text: "Clean and prepare your station", completed: false },
    { id: 6, text: "Clean the dining area and your work stations.", completed: false },
    { id: 7, text: "Clean the restrooms.", completed: false }
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  useEffect(() => {
      // 1. Process Orders from Firebase (Real-time) - CHANGED TO 'orders'
      const txnsCollectionRef = collection(db, 'orders');
      const unsubscribeTxns = onSnapshot(txnsCollectionRef, (snapshot) => {
          const parsedTxns = snapshot.docs.map(doc => {
              const data = doc.data();
              
              // Sync formatting with StaffTransactions
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
                  itemsString: itemsSummary,
                  status: data.status || "Pending",
                  createdAt: data.createdAt?.toMillis() || 0,
                  ...data
              };
          });

          const pending = parsedTxns.filter(t => t.status === 'Pending');
          const preparing = parsedTxns.filter(t => t.status === 'Preparing');
          
          setPendingCount(pending.length);
          setPreparingCount(preparing.length);
          
          // Combine and sort by oldest first (FIFO)
          const combinedActive = [...pending, ...preparing].sort((a, b) => a.createdAt - b.createdAt);
          setActiveOrdersList(combinedActive);
          
      }, (error) => {
          console.error("Error fetching transactions for dashboard: ", error);
      });

      // 2. Process Staff Attendance from Firebase (Real-time)
      const staffCollectionRef = collection(db, 'staff');
      const unsubscribeStaff = onSnapshot(staffCollectionRef, (snapshot) => {
          const staffData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          }));
          setDynamicStaffData(staffData);
      }, (error) => {
          console.error("Error fetching staff for dashboard: ", error);
      });

      // Function to load local data (Inventory)
      const loadLocalData = () => {
          // 3. Process Inventory for Low Stock Alerts (Still Local Storage)
          const savedInventory = localStorage.getItem("clubC_inventory");
          if (savedInventory) {
              const parsedInv = JSON.parse(savedInventory);
              const counterLow = parsedInv.filter(item => item.status === 'Critical' || item.status === 'Low stock').length;
              const backroomLow = parsedInv.filter(item => (parseFloat(item.backStock) || 0) <= 2).length;

              setLowCounterItems(counterLow);
              setLowBackroomItems(backroomLow);
          }
      };

      loadLocalData();
      window.addEventListener('storage', loadLocalData);
      
      // Cleanup listeners on unmount
      return () => {
          unsubscribeTxns(); 
          unsubscribeStaff(); // Stop listening to staff updates when leaving page
          window.removeEventListener('storage', loadLocalData);
      };
  }, []);

  const renderStatusBadge = (status) => {
    let color = "#888"; // Default for Inactive / On Leave
    if (status === "Active") color = "#81c784";
    if (status === "On Break" || status === "Break") color = "#fbc02d";
    if (status === "Preparing") color = "#ff9800";
    if (status === "Pending") color = "#ef5350";

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
                          {/* SYNCED: Using receiptId, formatted time, and formatted itemsString */}
                          <strong>{order.receiptId}</strong> <span className="text-muted">• {order.time}</span>
                          <p style={{margin: "5px 0 0", fontSize: "0.9rem", color: "var(--text-muted)"}}>{order.itemsString}</p>
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
                {dynamicStaffData.length === 0 ? <div style={{textAlign: "center", color: "var(--text-muted)", padding: "20px 0"}}>No staff data found.</div> : (
                  dynamicStaffData.map((staff) => (
                    <div key={staff.id} className="modal-list-item">
                      <div>
                          <strong>{staff.name}</strong> 
                          <span className="text-muted" style={{fontSize: "0.8rem"}}> • {staff.role}</span>
                      </div>
                      {renderStatusBadge(staff.status)}
                    </div>
                  ))
                )}
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
              
              {/* STOCK ALERT CARD */}
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

            {/* NEW TO-DO LIST WIDGET */}
            <div className="metric-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left', cursor: 'default' }}>
              <div className="card-label-top" style={{margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px', color: 'var(--text-accent)', fontSize: '1.1rem'}}>
                Shift To-Do List
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto'}}>
                {tasks.map(task => (
                  <label key={task.id} style={{display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer'}}>
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={() => toggleTask(task.id)}
                      style={{ accentColor: '#C8A27C', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                    />
                    <span style={{ 
                      textDecoration: task.completed ? 'line-through' : 'none', 
                      color: task.completed ? 'var(--text-muted)' : 'var(--text-main)',
                      transition: 'all 0.2s ease',
                      lineHeight: '1.4'
                    }}>
                      {task.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="right-column">
            <div className="metric-card shift-widget" onClick={() => setActiveModal("shift")}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px"}}>
                  <div className="card-label-top" style={{margin: 0}}>Attendance and Status</div>
              </div>
              <div style={{borderBottom: "1px solid rgba(255,255,255,0.05)", margin: "0 -20px 15px -20px"}}></div>
              <div className="preview-list">
                
                {dynamicStaffData.length === 0 ? <div style={{textAlign: "center", color: "var(--text-muted)", padding: "10px", fontSize: "0.9rem"}}>No staff data found.</div> : (
                  dynamicStaffData.map((staff) => (
                    <div key={staff.id} className="preview-list-item">
                      <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                          <div className="initial-placeholder">{staff.initial || staff.name.charAt(0)}</div>
                          <div style={{fontSize: "0.85rem", color: "var(--text-main)"}}>
                              {staff.name} <span style={{fontSize: "0.75rem", color: "var(--text-muted)"}}>({staff.role})</span>
                          </div>
                      </div>
                      {renderStatusBadge(staff.status)}
                    </div>
                  ))
                )}

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
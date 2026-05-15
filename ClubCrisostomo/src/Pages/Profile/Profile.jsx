import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Components/Profile/Profile.css"; 
import { db } from "../../firebase";
import { collection, getDocs, updateDoc, doc, addDoc, query, where } from "firebase/firestore"; 

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Waiting for Approval");
  
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "Coffee Lover");
  const [userEmail, setUserEmail] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  const [userOrders, setUserOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const uid = localStorage.getItem("userUID"); 

  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [orderToRate, setOrderToRate] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRate, setIsSubmittingRate] = useState(false);

  useEffect(() => {
    if (!uid) {
      navigate("/login");
      return; 
    }
    setUserEmail(localStorage.getItem("userEmail") || "");

    const fetchRealOrders = async () => {
      try {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("userId", "==", uid)); 
        
        const snapshot = await getDocs(q);
        const realOrdersArray = snapshot.docs.map(doc => ({
          id: doc.id,         
          ...doc.data()       
        }));
        setUserOrders(realOrdersArray); 
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoadingOrders(false); 
      }
    };
    fetchRealOrders(); 
  }, [navigate, uid]);

  const handleLogout = () => {
    localStorage.clear(); 
    navigate("/");
  };

  const handleEditClick = () => {
    setTempName(userName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (tempName.trim() !== "") {
      setUserName(tempName);
      localStorage.setItem("userName", tempName); 
    }
    setIsEditingName(false);
  };

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmCancel) return;

    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: "Cancelled" });
      
      setUserOrders(prevOrders => 
        prevOrders.map(order => order.id === orderId ? { ...order, status: "Cancelled" } : order)
      );
      alert("Order successfully cancelled.");
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Could not cancel order right now.");
    }
  };

  // --- NEW: Handle Receiving Order ---
  const handleReceiveOrder = async (orderId) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: "Completed" }); // Moves it to the 'To Rate' tab
      
      setUserOrders(prevOrders => 
        prevOrders.map(order => order.id === orderId ? { ...order, status: "Completed" } : order)
      );
      
      // Auto-switch tab to let them rate it immediately
      setActiveTab("To Rate");
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Could not update order right now.");
    }
  };

  // --- NEW: Handle Report Issue ---
  const handleReportIssue = (receiptId) => {
    alert(`We are sorry to hear that! Customer Support has been notified regarding order ${receiptId}. A staff member will assist you shortly.`);
    // You can expand this later to update a database flag if needed.
  };

  const openRateModal = (order) => {
    setOrderToRate(order);
    setRatingScore(5); 
    setRatingComment("");
    setIsRateModalOpen(true);
  };

  const handleRateSubmit = async () => {
    if (!orderToRate) return;
    setIsSubmittingRate(true);

    try {
      await addDoc(collection(db, "feedbacks"), {
        userId: uid,
        userName: userName,
        orderId: orderToRate.receiptId || orderToRate.id || "Unknown",
        rating: ratingScore,
        comment: ratingComment,
        date: new Date().toLocaleString(),
        timestamp: new Date().getTime() 
      });

      const orderRef = doc(db, "orders", orderToRate.id);
      await updateDoc(orderRef, { isRated: true });

      setUserOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderToRate.id ? { ...order, isRated: true } : order
        )
      );

      setIsRateModalOpen(false);
      setOrderToRate(null);
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmittingRate(false);
    }
  };

  // --- UPDATED LOGIC FILTER ---
  const filteredOrders = userOrders.filter(order => {
    const status = order.status || "";
    if (activeTab === "Waiting for Approval") return status === "Pending"; // Staff hasn't accepted yet
    if (activeTab === "To Ship") return status === "Preparing"; // Staff accepted, kitchen is cooking
    if (activeTab === "To Receive") return status === "To Receive"; // Staff clicked 'Done', waiting for customer
    if (activeTab === "To Rate") return status === "Completed"; // Customer clicked 'Received', ready to rate
    return false;
  });

  return (
    <div className="profile-page-container">
      <nav className="profile-nav">
        <Link to="/" className="back-btn">&larr; Back to Home</Link>
        <button onClick={handleLogout} className="logout-action-btn">Log Out</button>
      </nav>

      <div className="profile-content fade-in-up">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{userName.charAt(0).toUpperCase()}</span>
          </div>
          
          <div className="profile-details">
            {isEditingName ? (
              <div className="name-edit-container">
                <input 
                  type="text" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)} 
                  className="name-edit-input"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button onClick={handleSaveName} className="save-name-btn">Save</button>
              </div>
            ) : (
              <div className="name-display-container">
                <h2>{userName}</h2>
                <button onClick={handleEditClick} className="edit-name-btn" title="Edit Name">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </button>
              </div>
            )}
            <p>{userEmail}</p>
            <span className="member-badge">Gold Member</span>
          </div>
        </div>

        <div className="orders-dashboard">
          <div className="dashboard-header">
            <h3>Your Orders</h3>
            <div className="order-tabs">
              <button className={activeTab === "Waiting for Approval" ? "active" : ""} onClick={() => setActiveTab("Waiting for Approval")}>Waiting for Approval</button>
              <button className={activeTab === "To Ship" ? "active" : ""} onClick={() => setActiveTab("To Ship")}>To Ship</button>
              <button className={activeTab === "To Receive" ? "active" : ""} onClick={() => setActiveTab("To Receive")}>To Receive</button>
              <button className={activeTab === "To Rate" ? "active" : ""} onClick={() => setActiveTab("To Rate")}>To Rate</button>
            </div>
          </div>

          <div className="orders-list">
            {isLoadingOrders ? (
              <p className="no-orders" style={{color: "#C8A27C"}}>Loading your orders from the kitchen...</p>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <div key={index} className="order-card">
                  <div className="order-card-header">
                    <span className="order-id">
                      {order.receiptId || order.id || "Order"}
                    </span>
                    <span className={`status-badge ${activeTab.replace(/\s+/g, '-').toLowerCase()}`}>
                      {order.status || activeTab}
                    </span>
                  </div>
                  
                  <div className="order-card-body">
                    <p className="order-date">{order.date || "Just now"}</p>
                    <ul className="order-items">
                      {order.items && order.items.map((item, i) => (
                        <li key={i}>
                          {typeof item === 'object' ? (
                            <span>{item.quantity}x {item.name}</span>
                          ) : (
                            <span>{item}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="order-card-footer">
                    <span className="order-total">Total: ₱{order.totalAmount || order.total || "0"}</span>
                    
                    {/* BUTTONS FOR 'WAITING FOR APPROVAL' */}
                    {activeTab === "Waiting for Approval" && (
                      <div className="action-button-group">
                        <button className="cancel-btn" onClick={() => handleCancelOrder(order.id)}>Cancel Order</button>
                      </div>
                    )}

                    {/* BUTTONS FOR 'TO RECEIVE' */}
                    {activeTab === "To Receive" && (
                      <div className="action-button-group" style={{ display: 'flex', gap: '10px' }}>
                        <button className="receive-btn" onClick={() => handleReceiveOrder(order.id)} style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                          Order Received
                        </button>
                        <button className="issue-btn" onClick={() => handleReportIssue(order.receiptId)} style={{ backgroundColor: 'transparent', color: '#ef5350', border: '1px solid #ef5350', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                          Report Issue
                        </button>
                      </div>
                    )}
                    
                    {/* BUTTONS FOR 'TO RATE' */}
                    {activeTab === "To Rate" && (
                      order.isRated ? (
                        <span className="rated-badge">Rated ⭐</span>
                      ) : (
                        <button className="rate-btn" onClick={() => openRateModal(order)}>Rate Order</button>
                      )
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-orders">No orders found in "{activeTab}". Time to grab some coffee!</p>
            )}
          </div>
        </div>
      </div>

      {/* RATING MODAL */}
      {isRateModalOpen && (
        <div className="modal-overlay">
          <div className="rate-modal fade-in-up">
            <h3>How was your order?</h3>
            <p className="modal-subtitle">Order {orderToRate?.receiptId || orderToRate?.id || ""}</p>
            
            <div className="star-rating-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  className={`star ${star <= ratingScore ? 'filled' : ''}`}
                  onClick={() => setRatingScore(star)}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea 
              className="feedback-textarea" 
              placeholder="Tell us what you loved (or what we can improve)..."
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              rows="4"
            ></textarea>

            <div className="modal-actions">
              <button 
                className="modal-cancel-btn" 
                onClick={() => setIsRateModalOpen(false)}
                disabled={isSubmittingRate}
              >
                Cancel
              </button>
              <button 
                className="modal-submit-btn" 
                onClick={handleRateSubmit}
                disabled={isSubmittingRate}
              >
                {isSubmittingRate ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Components/PaymentpageComponents/Paymentpage.css";

// IMPORT FIREBASE LOGIC
import { db } from "../../firebase.jsx"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PaymentPageMain() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showQR, setShowQR] = useState(false);
  
  // Delivery Details States
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Success Screen States
  const [orderComplete, setOrderComplete] = useState(false);
  const [receiptId, setReceiptId] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);

    // Calculate Grand Total
    const computedTotal = storedCart.reduce((acc, item) => {
      return acc + (item.total * (item.quantity || 1));
    }, 0);

    setTotal(computedTotal);
  }, []);

  const handlePaymentChange = (value) => {
    setPaymentMethod(value);
    setShowQR(value === "ewallet");
  };

  const processOrder = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    setIsProcessing(true);
    
    // Generate a random Receipt ID
    const id = `CC-${Math.floor(1000 + Math.random() * 9000)}`;

    // Grab the logged-in user's secret ID
    const uid = localStorage.getItem("userUID") || "guest";
    
    // Build the order package for Firebase with delivery details
    const newOrder = {
      receiptId: id,
      userId: uid,
      customerName: customerName,
      address: address,
      contactNumber: contactNumber,
      landmark: landmark || "None provided",
      items: cart,
      totalAmount: total,
      paymentMethod: paymentMethod === "cash" ? "Cash" : "E-Wallet",
      status: "Pending",
      createdAt: serverTimestamp()
    };

    try {
      // Sent to the global "transactions" folder for Staff to see
      await addDoc(collection(db, "transactions"), newOrder);
      
      // Update states to show success screen
      setReceiptId(id);
      setOrderComplete(true);
      
      // Clear the cart from localStorage
      localStorage.removeItem("cart");
    } catch (error) {
      console.error("Error saving order: ", error);
      alert("Failed to process order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!paymentMethod) return alert("Please select a payment method");
    if (!customerName || !address || !contactNumber) return alert("Please fill in all delivery details");

    // For Cash, trigger processOrder immediately on submit
    if (paymentMethod === "cash") {
      processOrder();
    }
  };

  return (
    <div className="payment-page">
      {!orderComplete ? (
        <div className="payment-container animate-in">
          <div className="payment-header">
            <Link to="/cart" className="back-link">← Back to Cart</Link>
            <h2>Checkout</h2>
          </div>

          <div className="summary-card">
            <span>Amount to Pay</span>
            <h1 className="total-display">₱{total}</h1>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            
            {/* Delivery Details Section */}
            <div className="delivery-details-section">
              <label className="section-label">Delivery Details</label>
              
              <input 
                type="text" 
                placeholder="Name" 
                className="checkout-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              
              <input 
                type="text" 
                placeholder="Complete Address" 
                className="checkout-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              
              <input 
                type="tel" 
                placeholder="Contact Number" 
                className="checkout-input"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
              />
              
              <input 
                type="text" 
                placeholder="Nearest Landmark / Other info (Optional)" 
                className="checkout-input"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />
            </div>

            {/* Payment Method Section */}
            <label className="section-label" style={{ marginTop: '20px' }}>Select Payment Method</label>
            
            <div className="method-grid-2">
              <label className={`method-tile ${paymentMethod === "cash" ? "active" : ""}`}>
                <input type="radio" name="payment" value="cash" onChange={(e) => handlePaymentChange(e.target.value)} />
                <span className="method-name">Cash</span>
              </label>

              <label className={`method-tile ${paymentMethod === "ewallet" ? "active" : ""}`}>
                <input type="radio" name="payment" value="ewallet" onChange={(e) => handlePaymentChange(e.target.value)} />
                <span className="method-name">E-Wallet</span>
              </label>
            </div>

            {showQR && (
              <div className="qr-section animate-in">
                <p>Scan to pay via GCash or Maya</p>
                <img src="/Resources/gcashqr.jpg" alt="QR Code" className="qr-image" />
                <button 
                  type="button" 
                  className="verify-btn" 
                  onClick={processOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "I have paid"}
                </button>
              </div>
            )}

            {(paymentMethod === "cash") && (
              <button type="submit" className="pay-btn" disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Confirm Order"}
              </button>
            )}
          </form>
        </div>
      ) : (
        /* --- ORDER SUCCESS VIEW --- */
        <div className="success-container animate-in">
          <div className="success-icon">✓</div>
          <h2>Order Received!</h2>
          <p>Your caffeine is being prepared for delivery.</p>
          
          <div className="receipt-box">
            <span className="label">Order Number</span>
            <h3 className="order-id">{receiptId}</h3>
            <div className="receipt-details">
              <div className="receipt-row">
                <span>Total Amount</span>
                <span>₱{total}</span>
              </div>
              <div className="receipt-row">
                <span>Payment</span>
                <span style={{ color: '#C8A27C' }}>{paymentMethod === 'cash' ? 'Cash' : 'E-Wallet'}</span>
              </div>
              <div className="receipt-row">
                <span>Status</span>
                <span className="status-badge">Pending</span>
              </div>
            </div>
          </div>

          {/* --- THE ROUTING UPDATE --- */}
          <button className="done-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
}
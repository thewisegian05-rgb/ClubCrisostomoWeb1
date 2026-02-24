import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Components/PaymentpageComponents/Paymentpage.css";

export default function PaymentPageMain() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showCard, setShowCard] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  // Success Screen States
  const [orderComplete, setOrderComplete] = useState(false);
  const [receiptId, setReceiptId] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);

    // Calculate Grand Total: (Unit Price * Quantity)
    const computedTotal = storedCart.reduce((acc, item) => {
      return acc + (item.total * (item.quantity || 1));
    }, 0);

    setTotal(computedTotal);
  }, []);

  const handlePaymentChange = (value) => {
    setPaymentMethod(value);
    setShowCard(value === "card");
    setShowQR(value === "ewallet");
  };

  const processOrder = () => {
    // Generate a random Receipt ID (e.g., CC-5421)
    const id = `CC-${Math.floor(1000 + Math.random() * 9000)}`;
    setReceiptId(id);
    
    // Show the success screen
    setOrderComplete(true);
    
    // Clear the cart from localStorage
    localStorage.removeItem("cart");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!paymentMethod) return alert("Please select a payment method");

    // For Counter and Card, we trigger success on submit
    if (paymentMethod === "counter" || paymentMethod === "card") {
      processOrder();
    }
  };

  return (
    <div className="payment-page">
      {!orderComplete ? (
        /* --- PAYMENT FORM VIEW --- */
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
            <label className="section-label">Select Payment Method</label>
            
            <div className="method-grid">
              <label className={`method-tile ${paymentMethod === "counter" ? "active" : ""}`}>
                <input type="radio" name="payment" value="counter" onChange={(e) => handlePaymentChange(e.target.value)} />
                <span className="method-name">Counter</span>
              </label>

              <label className={`method-tile ${paymentMethod === "ewallet" ? "active" : ""}`}>
                <input type="radio" name="payment" value="ewallet" onChange={(e) => handlePaymentChange(e.target.value)} />
                <span className="method-name">E-Wallet</span>
              </label>

              <label className={`method-tile ${paymentMethod === "card" ? "active" : ""}`}>
                <input type="radio" name="payment" value="card" onChange={(e) => handlePaymentChange(e.target.value)} />
                <span className="method-name">Card</span>
              </label>
            </div>

            {showQR && (
              <div className="qr-section animate-in">
                <p>Scan to pay via GCash or Maya</p>
                <img src="/Resources/gcashqr.jpg" alt="QR Code" className="qr-image" />
                <button type="button" className="verify-btn" onClick={processOrder}>
                  I have paid
                </button>
              </div>
            )}

            {showCard && (
              <div className="card-fields animate-in">
                <input type="text" placeholder="Cardholder Name" required />
                <input type="text" placeholder="Card Number" maxLength="16" required />
                <div className="form-row">
                  <input type="text" placeholder="MM/YY" maxLength="5" required />
                  <input type="password" placeholder="CVV" maxLength="3" required />
                </div>
              </div>
            )}

            {(paymentMethod && paymentMethod !== "ewallet") && (
              <button type="submit" className="pay-btn">
                Confirm Order
              </button>
            )}
          </form>
        </div>
      ) : (
        /* --- ORDER SUCCESS VIEW --- */
        <div className="success-container animate-in">
          <div className="success-icon">✓</div>
          <h2>Order Received!</h2>
          <p>Your caffeine is being prepared.</p>
          
          <div className="receipt-box">
            <span className="label">Order Number</span>
            <h3 className="order-id">{receiptId}</h3>
            <div className="receipt-details">
              <div className="receipt-row">
                <span>Total Paid</span>
                <span>₱{total}</span>
              </div>
              <div className="receipt-row">
                <span>Status</span>
                <span className="status-badge">Preparing</span>
              </div>
            </div>
          </div>

          <button className="done-btn" onClick={() => navigate("/menu")}>
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import "../../Components/PaymentpageComponents/Paymentpage.css";

export default function PaymentPageMain() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showCard, setShowCard] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);

    let computedTotal = 0;
    storedCart.forEach(item => {
      let itemTotal = item.basePrice;
      if (item.addons) {
        item.addons.forEach(a => {
          itemTotal += a.price * a.qty;
        });
      }
      computedTotal += itemTotal;
    });

    setTotal(computedTotal);
  }, []);

  const handlePaymentChange = (value) => {
    setPaymentMethod(value);

    if (value === "card") {
      setShowCard(true);
      setShowQR(false);
    } else if (value === "ewallet") {
      setShowQR(true);
      setShowCard(false);
    } else {
      setShowCard(false);
      setShowQR(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (paymentMethod === "counter") {
      alert("Order placed! Please pay at the counter.");
      localStorage.removeItem("cart");
      window.location.href = "/menu";
    }

    if (paymentMethod === "card") {
      alert("Card Payment Successful!");
      localStorage.removeItem("cart");
      window.location.href = "/menu";
    }
  };

  const handleQRClick = () => {
    alert("Payment received via GCash/Maya!");
    localStorage.removeItem("cart");
    window.location.href = "/menu";
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h2>Payment Details</h2>

        <h3>Total: ₱{total}</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Payment Method</label>

            <div className="payment-options">
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="counter"
                  onChange={(e) => handlePaymentChange(e.target.value)}
                />
                Pay at the Counter
              </label>

              <label>
                <input
                  type="radio"
                  name="payment"
                  value="ewallet"
                  onChange={(e) => handlePaymentChange(e.target.value)}
                />
                GCash / Maya
              </label>

              <label>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  onChange={(e) => handlePaymentChange(e.target.value)}
                />
                Card
              </label>
            </div>
          </div>

          {showQR && (
            <img
              src="/Resources/gcashqr.jpg"
              alt="GCash QR"
              className="qr-image"
              onClick={handleQRClick}
            />
          )}

          {showCard && (
            <div className="card-details">
              <input type="text" placeholder="Full Name" />
              <input type="text" placeholder="Card Number" maxLength="16" />
              <input type="text" placeholder="MM/YY" maxLength="5" />
              <input type="password" placeholder="CVV" maxLength="3" />
            </div>
          )}

          {paymentMethod !== "ewallet" && (
            <button type="submit" className="pay-btn">
              Pay ₱{total}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
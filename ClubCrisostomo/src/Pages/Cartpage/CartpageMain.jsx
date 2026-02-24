import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../Components/CartpageComponents/Cartpage.css";

const CartpageMain = () => {
  // FIX: Initialize state directly from localStorage
  const [cart, setCart] = useState(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    // Ensure every item has quantity and unitPrice immediately
    return storedCart.map(item => ({
      ...item,
      quantity: item.quantity || 1,
      unitPrice: item.total || item.basePrice || 0 
    }));
  });

  // Save to localStorage whenever 'cart' state changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Sync cart across tabs (in case you add items in one tab and cart is open in another)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "cart") {
        setCart(JSON.parse(e.newValue) || []);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const updateQuantity = (index, delta) => {
    setCart(prevCart => prevCart.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (index) => {
    setCart(prevCart => prevCart.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item) => {
    return (item.unitPrice || 0) * (item.quantity || 1);
  };

  const calculateGrandTotal = () => {
    return cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  return (
    <div className="cart-wrapper">
      <nav className="navBar">
        <div className="nav-left">
          <Link to="/" className="logo-link">
            <h1 className="logo">Club C.</h1>
          </Link>
        </div>
        <div className="nav-right">
          <Link to="/menu" className="menu-btn">Menu</Link>
          <div className="total-amount">₱{calculateGrandTotal()}</div>
          <Link to="/payment" className={`checkout-btn ${cart.length === 0 ? "disabled" : ""}`}>
            Check Out
          </Link>
        </div>
      </nav>

      

      <section className="cart-page">
        <div className="cart-container">
          {cart.length === 0 ? (
            <div className="empty-state">
              <h3>Your cart is empty.</h3>
              <p>Your caffeine levels are looking dangerously low!</p>
              <Link to="/menu" className="shop-link">Go to Menu</Link>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map((item, index) => (
                <div key={item.id || index} className="cart-card animate-in">
                  <img src={item.img} alt={item.name} className="item-img" />
                  
                  <div className="item-details">
                    <div className="item-header">
                      <div className="item-title-group">
                        <h4>{item.name}</h4>
                        {item.addons?.length > 0 && (
                          <div className="addons-summary">
                            {item.addons.map((a, i) => (
                              <span key={i} className="addon-badge">
                                +{a.name} (x{a.qty})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="item-price-tag">₱{calculateItemTotal(item)}</span>
                    </div>

                    <div className="item-actions">
                      <div className="qty-picker">
                        <button onClick={() => updateQuantity(index, -1)}>−</button>
                        <span className="qty-number">{item.quantity}</span>
                        <button onClick={() => updateQuantity(index, 1)}>+</button>
                      </div>
                      <button className="remove-text" onClick={() => removeItem(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CartpageMain;
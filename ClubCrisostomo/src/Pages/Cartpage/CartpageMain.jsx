import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../Components/CartpageComponents/Cartpage.css";

const CartpageMain = () => {
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState([]);

  // Load cart from localStorage
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
    setQuantities(storedCart.map(() => 1)); // default qty = 1
  }, []);

  // Update localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const increaseQty = (index) => {
    const updated = [...quantities];
    updated[index]++;
    setQuantities(updated);
  };

  const decreaseQty = (index) => {
    const updated = [...quantities];
    if (updated[index] > 1) updated[index]--;
    setQuantities(updated);
  };

  const removeItem = (index) => {
    const updatedCart = [...cart];
    const updatedQty = [...quantities];
    updatedCart.splice(index, 1);
    updatedQty.splice(index, 1);
    setCart(updatedCart);
    setQuantities(updatedQty);
  };

  const calculateItemTotal = (item, index) => {
    let total = item.basePrice || item.price || 0;

    if (item.addons && item.addons.length > 0) {
      item.addons.forEach((a) => {
        total += a.price * a.qty;
      });
    }

    return total * quantities[index];
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item, index) => {
      return sum + calculateItemTotal(item, index);
    }, 0);
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="navBar">
        <h1 className="logo">Club C.</h1>

        <div className="nav-right">
          <Link to="/menu" className="menu-btn">
            Menu
          </Link>

          <div className="total-amount">
            ₱{calculateTotal()}
          </div>

          <Link to="/payment" className="checkout-btn">
            Check Out
          </Link>
        </div>
      </nav>

      {/* CART PAGE */}
      <section className="cart-page">
        <div className="cart-content">
          <div className="cart-items">
            {cart.length === 0 && <h3>Your cart is empty.</h3>}

            {cart.map((item, index) => (
              <div key={index} className="cart-card">
                <img src={item.img} alt={item.name} />

                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>₱{item.basePrice || item.price}</p>

                  {item.addons && item.addons.length > 0 && (
                    <ul>
                      {item.addons.map((a, i) => (
                        <li key={i}>
                          {a.name} x{a.qty} - ₱{a.price * a.qty}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="item-controls">
                  <div className="qty">
                    <button onClick={() => decreaseQty(index)}>-</button>
                    <span className="count">{quantities[index]}</span>
                    <button onClick={() => increaseQty(index)}>+</button>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default CartpageMain;
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../Components/MenupageComponents/Menupage.css";

// --- 1. IMPORT FIREBASE ---
// Make sure this points to your exact firebase.jsx file location
import { db } from "../../firebase.jsx"; 
import { collection, onSnapshot } from "firebase/firestore";

const ITEM_IMG = "/process-preparing-espresso-professional-coffee-machine-closeup.jpg";

const ADDON_PRICES = { 
  Espresso: 40, Syrup: 30, "Nata Jelly": 15, Cereal: 25, Oreo: 25, Cinnamon: 20, "Bottled Water": 20 
};

const INITIAL_ADDONS = { 
  Espresso: 0, Syrup: 0, "Nata Jelly": 0, Cereal: 0, Oreo: 0, Cinnamon: 0, "Bottled Water": 0 
};

const AutoCarousel = ({ items, onCardClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) return null;

  return (
    <div className="carousel-wrapper">
      <div className="carousel-container">
        {items.map((item, index) => {
          let position = "nextCard";
          if (index === activeIndex) position = "activeCard";
          else if (index === activeIndex - 1 || (activeIndex === 0 && index === items.length - 1)) position = "prevCard";

          return (
            <div key={item.id || index} className={`carousel-card ${position}`} onClick={() => onCardClick(item)}>
              <div className="carousel-image-box">
                <img src={item.img || ITEM_IMG} alt={item.name} />
              </div>
              <div className="carousel-details">
                <h4>{item.name}</h4>
                <span className="price-tag">₱{item.price}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function MenupageMain() {
  const [cartCount, setCartCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tempMode, setTempMode] = useState("hot"); 
  const [addons, setAddons] = useState(INITIAL_ADDONS);
  const [expandedSections, setExpandedSections] = useState({});
  const [notification, setNotification] = useState({ show: false, message: "" });
  
  // --- 2. LIVE FIREBASE STATE ---
  const [menuData, setMenuData] = useState({
    'Coffee': [], 'Non Coffee': [], 'Refreshers': [], 'Snacks': []
  });

  // --- 3. FETCH LIVE DATA FROM ADMIN ---
  useEffect(() => {
    const menuCollection = collection(db, 'menu');
    
    // onSnapshot listens for real-time changes!
    const unsubscribe = onSnapshot(menuCollection, (snapshot) => {
      const liveMenu = { 'Coffee': [], 'Non Coffee': [], 'Refreshers': [], 'Snacks': [] };
      
      snapshot.docs.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() };
        
        // Hide items marked "Not Available" by admin
        if (item.availability === "Not Available") return;
        
        // Push the item into the correct category array based on what the Admin selected
        const category = item.category || 'Coffee';
        if (liveMenu[category]) {
          liveMenu[category].push(item);
        }
      });
      
      setMenuData(liveMenu);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartCount(cart.length);
  }, []);

  const openModal = (item) => {
    setSelectedItem(item);
    setTempMode("hot");
    setAddons(INITIAL_ADDONS);
    setModalOpen(true);
  };

  const updateAddon = (type, val) => {
    setAddons(prev => ({ ...prev, [type]: Math.max(0, prev[type] + val) }));
  };

  const calculateTotal = () => {
    if (!selectedItem) return 0;
    let basePrice = Number(selectedItem.price) || 0; 
    let addonTotal = Object.entries(addons).reduce((acc, [name, qty]) => acc + (qty * (ADDON_PRICES[name] || 0)), 0);
    return basePrice + addonTotal;
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const activeAddons = Object.entries(addons)
      .filter(([_, qty]) => qty > 0)
      .map(([name, qty]) => ({ name, qty, price: ADDON_PRICES[name] }));

    const isDrink = selectedItem.category !== "Snacks";

    const orderItem = {
      name: `${selectedItem.name} ${isDrink ? `(${tempMode.toUpperCase()})` : ""}`,
      basePrice: Number(selectedItem.price),
      addons: activeAddons,
      total: calculateTotal(),
      quantity: 1, 
      img: selectedItem.img || ITEM_IMG,
      id: Date.now()
    };

    cart.push(orderItem);
    localStorage.setItem("cart", JSON.stringify(cart));
    setCartCount(cart.length);
    setModalOpen(false);

    setNotification({ show: true, message: `${selectedItem.name} added to cart!` });
    setTimeout(() => setNotification({ show: false, message: "" }), 3000);
  };

  return (
    <div className="menu-page">
      {notification.show && (
        <div className="cart-notification animate-pop">
          <div className="notif-content">
            <span className="check-icon">✓</span>
            {notification.message}
          </div>
        </div>
      )}

      <nav className="navBar">
        <div className="nav-left">
          <Link to="/" className="logo-link">
            <h1 className="logo">Club C.</h1>
          </Link>
        </div>
        
        <div className="nav-buttons-centered">
          <ul className="nav-links">
            <li><a href="#Coffee">Coffee</a></li>
            <li><a href="#Non Coffee">Non-Coffee</a></li>
            <li><a href="#Refreshers">Refreshers</a></li>
            <li><a href="#Snacks">Snacks</a></li>
          </ul>
        </div>

        <div className="nav-right">
          <button className="cart-btn" onClick={() => window.location.href='/cart'}>
            Cart <span className="cart-badge">{cartCount}</span>
          </button>
        </div>
      </nav>

      <header className="hero">
        <h2>Crafted with care, brewed with passion.</h2>
      </header>

      {/* --- 4. RENDER LIVE FIREBASE DATA --- */}
      {Object.entries(menuData).map(([sectionKey, items]) => {
        // Skip rendering the section entirely if the admin hasn't added any items to it yet
        if (items.length === 0) return null;

        const isExpanded = expandedSections[sectionKey];
        const visibleItems = isExpanded ? items : items.slice(0, 6);

        return (
          <section key={sectionKey} id={sectionKey} className="menu-section">
            <h3 className="section-title">{sectionKey.toUpperCase()} FAVES</h3>
            
            <AutoCarousel items={items.slice(0, 5)} onCardClick={openModal} />

            <div className="menu-grid">
              {visibleItems.map((item, idx) => (
                <div key={item.id || idx} className="menu-card animate-in" onClick={() => openModal(item)} style={{animationDelay: `${idx * 0.05}s`}}>
                  <div className="card-img-wrapper">
                     <img src={item.img || ITEM_IMG} alt={item.name} />
                  </div>
                  <div className="card-info">
                    <h4>{item.name}</h4>
                    {/* Fallback description since the admin form doesn't have one yet */}
                    <p>{item.desc || "A delicious treat from Club Crisostomo."}</p>
                    <div className="card-footer">
                      <span className="card-price">₱{item.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 6 && (
              <button className="toggle-btn" onClick={() => setExpandedSections(prev => ({...prev, [sectionKey]: !prev[sectionKey]}))}>
                {isExpanded ? "Show Less" : "View Full Menu"}
              </button>
            )}
          </section>
        );
      })}

      {modalOpen && selectedItem && (
        <div className="modal show" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setModalOpen(false)}>&times;</button>
            <h3 className="modal-item-name">{selectedItem.name}</h3>
            
            {/* Only show Hot/Iced toggle if it's not a snack */}
            {selectedItem.category !== "Snacks" && (
              <div className="temp-selection">
                <p>Select Temperature</p>
                <div className="temp-toggle-container">
                  <span className={`selection-slider ${tempMode}`}></span>
                  <button 
                    className={`temp-btn ${tempMode === "hot" ? "active" : ""}`} 
                    onClick={() => setTempMode("hot")}
                  >Hot</button>
                  <button 
                    className={`temp-btn ${tempMode === "iced" ? "active" : ""}`} 
                    onClick={() => setTempMode("iced")}
                  >Iced</button>
                </div>
              </div>
            )}

            <div className="addon-header-row">
              <h4 className="addon-header">Add-ons (Extras)</h4>
              <button className="clear-link" onClick={() => setAddons(INITIAL_ADDONS)}>Clear All</button>
            </div>
            
            <div className="addons-list">
              {Object.keys(ADDON_PRICES).map((addonKey) => (
                <div className="addon-row" key={addonKey}>
                  <span className="addon-name">{addonKey}</span>
                  <div className="addon-controls-wrapper">
                    <span className="addon-price">₱{ADDON_PRICES[addonKey]}</span>
                    <div className="qty-controls">
                      <button onClick={() => updateAddon(addonKey, -1)}>−</button>
                      <span className="count">{addons[addonKey]}</span>
                      <button onClick={() => updateAddon(addonKey, 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <div className="total-display">
                <span className="total-label">TOTAL</span>
                <strong className="total-amount">₱{calculateTotal()}</strong>
              </div>
              <button className="add-cart-btn" onClick={addToCart}>Add to Cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
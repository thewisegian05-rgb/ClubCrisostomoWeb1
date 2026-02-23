import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../Components/MenupageComponents/Menupage.css";

// Path to the image you provided (located in your public folder)
const ITEM_IMG = "/process-preparing-espresso-professional-coffee-machine-closeup.jpg";

const MENU_DATA = {
  coffee: [
    { name: "Long Black", desc: "Pure espresso with hot water.", price: 90, icedPrice: 100, type: "drink", img: ITEM_IMG },
    { name: "Cinnamon Latte", desc: "Espresso with steamed milk and cinnamon.", price: 100, icedPrice: 110, type: "drink", img: ITEM_IMG },
    { name: "Muscuvado Latte", desc: "Sweetened with natural muscovado sugar.", price: 110, icedPrice: 120, type: "drink", img: ITEM_IMG },
    { name: "Dirty Matcha", desc: "Matcha green tea topped with espresso.", price: 120, icedPrice: 130, type: "drink", img: ITEM_IMG },
    { name: "Hazelnut Latte", desc: "Creamy espresso with hazelnut notes.", price: 110, icedPrice: 120, type: "drink", img: ITEM_IMG },
    { name: "Mochaccino", desc: "Chocolate-flavored cappuccino.", price: 110, icedPrice: 120, type: "drink", img: ITEM_IMG },
    { name: "Spanish Latte", desc: "Smooth espresso with creamy sweetness.", price: 100, icedPrice: 110, type: "drink", img: ITEM_IMG },
    { name: "Caramel Macchiato", desc: "Espresso with vanilla and caramel drizzle.", price: 110, icedPrice: 120, type: "drink", img: ITEM_IMG },
    { name: "Citron Espresso", desc: "Espresso with a refreshing citrus twist.", price: 110, icedPrice: 120, type: "drink", img: ITEM_IMG },
    { name: "Dirty Hazelnut Matcha", desc: "Hazelnut matcha with an espresso kick.", price: 120, icedPrice: 130, type: "drink", img: ITEM_IMG },
  ],
  noncoffee: [
    { name: "Chocolate", desc: "Rich and creamy cocoa.", price: 90, icedPrice: 100, type: "drink", img: ITEM_IMG },
    { name: "Strawberry", desc: "Sweet milk with strawberry flavor.", price: 0, icedPrice: 100, type: "drink", img: ITEM_IMG },
    { name: "Blueberry", desc: "Creamy milk with blueberry essence.", price: 0, icedPrice: 100, type: "drink", img: ITEM_IMG },
    { name: "Oreo Matcha", desc: "Matcha latte with crushed Oreos.", price: 0, icedPrice: 120, type: "drink", img: ITEM_IMG },
    { name: "Mixed Berries", desc: "Refreshing blend of berry flavors.", price: 0, icedPrice: 110, type: "drink", img: ITEM_IMG },
    { name: "Matcha", desc: "Premium green tea with milk.", price: 100, icedPrice: 110, type: "drink", img: ITEM_IMG },
    { name: "Choco Cereal", desc: "Chocolate milk with crunchy cereal.", price: 0, icedPrice: 120, type: "drink", img: ITEM_IMG },
    { name: "Berry Matcha", desc: "Matcha latte with berry notes.", price: 0, icedPrice: 120, type: "drink", img: ITEM_IMG },
    { name: "Hazelnut Matcha", desc: "Nutty hazelnut with green tea.", price: 110, icedPrice: 120, type: "drink", img: ITEM_IMG },
  ],
  refreshers: [
    { name: "Strawberry Soda", desc: "Refreshing fruity strawberry soda.", price: 0, icedPrice: 80, type: "drink", img: ITEM_IMG },
    { name: "Blue Lychee Soda", desc: "Cool blue lychee flavored soda.", price: 0, icedPrice: 80, type: "drink", img: ITEM_IMG },
    { name: "Citron & Ginger Tea", desc: "Zesty citron with a warm ginger kick.", price: 90, icedPrice: 100, type: "drink", img: ITEM_IMG },
    { name: "Passion Fruit Soda", desc: "Tropical passion fruit fizz.", price: 0, icedPrice: 80, type: "drink", img: ITEM_IMG },
    { name: "Calamansi Soda", desc: "Local citrus refresher.", price: 0, icedPrice: 90, type: "drink", img: ITEM_IMG },
    { name: "Honey Calamansi", desc: "Sweet honey with tart calamansi.", price: 80, icedPrice: 90, type: "drink", img: ITEM_IMG },
    { name: "Club Crisostomo Tea", desc: "Our signature house blend tea.", price: 100, icedPrice: 110, type: "drink", img: ITEM_IMG },
  ],
  snacks: [
    { name: "Blueberry Toastie", desc: "Sweet and toasted blueberry treat.", price: 65, type: "snack", img: ITEM_IMG },
    { name: "Mozzacheddar Toastie", desc: "Gooey mozzarella and cheddar melt.", price: 70, type: "snack", img: ITEM_IMG },
    { name: "French Fries", desc: "Crispy golden potato fries.", price: 90, type: "snack", img: ITEM_IMG },
    { name: "Hashbrowns", desc: "Crispy fried shredded potatoes.", price: 110, type: "snack", img: ITEM_IMG },
  ]
};

const ADDON_PRICES = { 
  Espresso: 40, Syrup: 30, "Nata Jelly": 15, Cereal: 25, Oreo: 25, Cinnamon: 20, "Bottled Water": 20 
};

const INITIAL_ADDONS = { 
  Espresso: 0, Syrup: 0, "Nata Jelly": 0, Cereal: 0, Oreo: 0, Cinnamon: 0, "Bottled Water": 0 
};

/* --- CAROUSEL COMPONENT --- */
const AutoCarousel = ({ items, onCardClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="slider-wrapper menu-carousel-spacing">
      <div className="slider-container">
        {items.map((item, index) => {
          let position = "nextCard";
          if (index === activeIndex) position = "activeCard";
          else if (index === activeIndex - 1 || (activeIndex === 0 && index === items.length - 1)) position = "prevCard";

          return (
            <div key={index} className={`slider-card ${position}`} onClick={() => onCardClick(item)}>
              <div className="card-image-box">
                <img src={ITEM_IMG} alt={item.name} />
              </div>
              <div className="card-details">
                <h3>{item.name}</h3>
                <span className="price-tag">₱{item.price === 0 ? item.icedPrice : item.price}</span>
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
    let base = (tempMode === "iced" || selectedItem.price === 0) ? (selectedItem.icedPrice || selectedItem.price) : selectedItem.price;
    let addonTotal = Object.entries(addons).reduce((acc, [name, qty]) => acc + (qty * (ADDON_PRICES[name] || 0)), 0);
    return base + addonTotal;
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const activeAddons = Object.entries(addons)
      .filter(([_, qty]) => qty > 0)
      .map(([name, qty]) => ({ name, qty, price: ADDON_PRICES[name] }));

    const orderItem = {
      name: `${selectedItem.name} (${selectedItem.type === "drink" ? tempMode.toUpperCase() : "Standard"})`,
      basePrice: selectedItem.price,
      addons: activeAddons,
      total: calculateTotal(),
      img: selectedItem.img,
      id: Date.now()
    };

    cart.push(orderItem);
    localStorage.setItem("cart", JSON.stringify(cart));
    setCartCount(cart.length);
    setModalOpen(false);
  };

  return (
    <div className="menu-page">
      <nav className="navBar">
        <div className="nav-left">
          <Link to="/" className="logo-link">
            <h1 className="logo">Club C.</h1>
          </Link>
        </div>
        
        <div className="nav-buttons-centered">
          <ul className="nav-links">
            <li><a href="#coffee">Coffee</a></li>
            <li><a href="#noncoffee">Non-Coffee</a></li>
            <li><a href="#refreshers">Refreshers</a></li>
            <li><a href="#snacks">Snacks</a></li>
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

      {Object.entries(MENU_DATA).map(([sectionKey, items]) => {
        const isExpanded = expandedSections[sectionKey];
        const visibleItems = isExpanded ? items : items.slice(0, 6);

        return (
          <section key={sectionKey} id={sectionKey} className="menu-section">
            <h3 className="section-title">{sectionKey.toUpperCase()} FAVES</h3>
            
            <AutoCarousel items={items.slice(0, 5)} onCardClick={openModal} />

            <div className="menu-grid">
              {visibleItems.map((item, idx) => (
                <div key={idx} className="menu-card animate-in" onClick={() => openModal(item)}>
                  <img src={item.img} alt={item.name} />
                  <div className="card-info">
                    <h4>{item.name}</h4>
                    <p>{item.desc}</p>
                    <div className="card-footer">
                      <span className="card-price">₱{item.price === 0 ? item.icedPrice : item.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 6 && (
              <button className="toggle-btn" onClick={() => setExpandedSections(prev => ({...prev, [sectionKey]: !prev[sectionKey]}))}>
                {isExpanded ? "Show Less" : "Show More"}
              </button>
            )}
          </section>
        );
      })}

      {modalOpen && (
        <div className="modal show" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setModalOpen(false)}>&times;</button>
            <h3 className="modal-item-name">{selectedItem.name}</h3>
            
            {selectedItem.type === "drink" && (
              <div className="temp-selection">
                <p>Select Temperature</p>
                <div className="temp-buttons">
                  <button 
                    className={tempMode === "hot" ? "active" : ""} 
                    onClick={() => setTempMode("hot")}
                    disabled={selectedItem.price === 0}
                  >Hot</button>
                  <button 
                    className={tempMode === "iced" ? "active" : ""} 
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
                  <div className="qty-controls">
                    <button onClick={() => updateAddon(addonKey, -1)}>−</button>
                    <span className="count">{addons[addonKey]}</span>
                    <button onClick={() => updateAddon(addonKey, 1)}>+</button>
                  </div>
                  <span className="addon-price">₱{ADDON_PRICES[addonKey]}</span>
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
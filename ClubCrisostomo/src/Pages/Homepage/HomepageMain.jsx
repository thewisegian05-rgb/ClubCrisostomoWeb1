import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Components/HomepageComponents/Homepage.css";

const MENU_DATA = [
  {
    category: "COFFEE FAVORITES",
    items: [
      { name: "Spanish Latte", price: "₱110", desc: "Signature creamy blend." },
      { name: "Caramel Macchiato", price: "₱120", desc: "Rich espresso & caramel." },
      { name: "Citron Espresso", price: "₱120", desc: "Refreshing citrus twist." },
      { name: "Dirty Hazelnut Matcha", price: "₱130", desc: "Espresso meets matcha." }
    ]
  },
  {
    category: "NON-COFFEE FAVORITES",
    items: [
      { name: "Mixed Berries", price: "₱110", desc: "Sweet seasonal blend." },
      { name: "Matcha", price: "₱110", desc: "Premium Japanese tea." },
      { name: "Choco Cereal", price: "₱120", desc: "Nostalgic chocolate crunch." },
      { name: "Berry Matcha", price: "₱120", desc: "Fruit-forward matcha." },
      { name: "Hazelnut Matcha", price: "₱120", desc: "Smooth nutty perfection." }
    ]
  },
  {
    category: "REFRESHER FAVORITES",
    items: [
      { name: "Passion Fruit Soda", price: "₱80", desc: "Tropical & fizzy." },
      { name: "Calamansi Soda", price: "₱90", desc: "Zesty local citrus." },
      { name: "Honey Calamansi", price: "₱90", desc: "Soothing honey blend." },
      { name: "Club Crisostomo Tea", price: "₱110", desc: "House-blend specialty." }
    ]
  }
];

const AutoCarousel = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="slider-wrapper">
      <div className="slider-container">
        {items.map((item, index) => {
          let position = "nextCard";
          if (index === activeIndex) position = "activeCard";
          else if (index === activeIndex - 1 || (activeIndex === 0 && index === items.length - 1)) position = "prevCard";

          return (
            <div key={index} className={`slider-card ${position}`}>
              <div className="card-image-box">
                <img src="/process-preparing-espresso-professional-coffee-machine-closeup.jpg" alt={item.name} />
              </div>
              <div className="card-details">
                <h3>{item.name}</h3>
                <span className="price-tag">{item.price}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PREFERENCE_GROUPS = {
  Flavor: ["Sweet", "Bitter", "Mild sweet", "Savory", "Sweet-Sour"],
  Temperature: ["Hot", "Cold"],
  Type: ["Coffee", "Non-coffee", "Refreshers", "Snacks"],
  Ingredients: ["Espresso", "Milk", "Matcha", "Hazelnut", "Chocolate", "Caramel", "Vanilla", "Cinnamon", "Citrus", "Strawberry", "Blueberry", "Berries", "Oreos", "Cereal", "Tea", "Ginger", "Honey", "Potato"]
};

const HomepageMain = () => {
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Login & Dropdown States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Mobile Hamburger Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();

  // Check login status on load
  useEffect(() => {
    const loggedInStatus = localStorage.getItem("isLoggedIn");
    if (loggedInStatus === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  // Handle intersection observer animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("show");
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    setShowDropdown(false);
    navigate("/");
  };

  const togglePreference = (preference) => {
    setSelectedPreferences((prev) =>
      prev.includes(preference)
        ? prev.filter((p) => p !== preference)
        : [...prev, preference]
    );
  };

  const getRecommendations = async () => {
    if (selectedPreferences.length === 0) {
      setError("Please select at least one preference");
      setRecommendations([]);
      return;
    }

    setLoading(true);
    setError("");
    setRecommendations([]);

    try {
      const response = await fetch("http://127.0.0.1:5000/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferences: selectedPreferences }),
      });

      if (!response.ok) {
        throw new Error("Failed to get recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError("Unable to connect to recommendation service. Make sure Flask is running on localhost:5000");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearPreferences = () => {
    setSelectedPreferences([]);
    setRecommendations([]);
    setError("");
  };

  return (
    <div className="homepage-container">
      <nav className="navBar">
        <div className="nav-left">
          <Link to="/" className="logo-link">
            <h1 className="Logo">Club C.</h1>
          </Link>
        </div>
        
        {/* DESKTOP LINKS (Hidden on Mobile) */}
        <div className="nav-buttons-centered desktop-only">
          <Link to="/menu" className="nav-link-animated">Full Menu</Link>
          <a href="#recommendation-section" className="nav-link-animated">Recommendation</a>
          <a href="#footer-info" className="nav-link-animated">Contact</a>
        </div>

        <div className="nav-right">
          {/* DESKTOP Login vs Profile Burger Menu (Hidden on Mobile) */}
          <div className="desktop-auth">
            {isLoggedIn ? (
              <div className="profile-menu-container">
                <button 
                  className="burger-btn" 
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  ☰
                </button>

                {showDropdown && (
                  <div className="dropdown-menu fade-in-dropdown">
                    <Link to="/profile" className="dropdown-item">My Profile</Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item logout-item">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="login-btn">Login</Link>
            )}
          </div>

          {/* MAIN MOBILE BURGER ICON */}
          <button 
            className="main-mobile-burger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className={`bar ${isMobileMenuOpen ? "open" : ""}`}></span>
            <span className={`bar ${isMobileMenuOpen ? "open" : ""}`}></span>
            <span className={`bar ${isMobileMenuOpen ? "open" : ""}`}></span>
          </button>
        </div>

        {/* MOBILE SLIDE-DOWN MENU */}
        <div className={`mobile-nav-dropdown ${isMobileMenuOpen ? "open" : ""}`}>
          <Link to="/menu" onClick={() => setIsMobileMenuOpen(false)}>Full Menu</Link>
          <a href="#recommendation-section" onClick={() => setIsMobileMenuOpen(false)}>Recommendation</a>
          <a href="#footer-info" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
          
          {/* MOBILE Authentication Links */}
          {!isLoggedIn ? (
            <Link to="/login" className="mobile-login-btn" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
          ) : (
            <>
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>My Profile</Link>
              <button 
                className="mobile-logout-btn" 
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <h2 className="h2 fade-in">Where Stories Brew</h2>
          <p className="hero-p fade-in">THE ART OF SLOWING DOWN</p>
        </div>
      </header>

      <main id="CF" className="multi-carousel-section">
        <div className="favorites-intro fade-in">
          <p className="intro-tagline">OUR TOP PICKS</p>
          <h2 className="intro-title">Club C Faves</h2>
        </div>

        {MENU_DATA.map((cat, idx) => (
          <section key={idx} className="category-shelf fade-in">
            <h2 className="shelf-title">{cat.category}</h2>
            <AutoCarousel items={cat.items} />
          </section>
        ))}
      </main>

      <section id="recommendation-section" className="recommendation-section fade-in">
        <div className="recommendation-container">
          <h2 className="recommendation-title">Find Your Perfect Product</h2>
          <p className="recommendation-subtitle">Select your preferences and we'll recommend the best products for you</p>

          <div className="preferences-section">
            {Object.entries(PREFERENCE_GROUPS).map(([category, options]) => (
              <div key={category} className="preference-category">
                <h3 className="category-title">{category}</h3>
                <div className="button-group">
                  {options.map((option) => (
                    <button
                      key={option}
                      className={`preference-btn ${
                        selectedPreferences.includes(option) ? "active" : ""
                      }`}
                      onClick={() => togglePreference(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="action-buttons">
            <button
              className="get-recommendation-btn"
              onClick={getRecommendations}
              disabled={loading}
            >
              {loading ? "Loading..." : "Get Recommendation"}
            </button>
            <button className="clear-btn" onClick={clearPreferences}>
              Clear All
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {recommendations.length > 0 && (
            <div className="recommendations-container">
              <h3>Top 5 Recommended Products</h3>
              <div className="recommendations-grid">
                {recommendations.map((drink, index) => (
                  <div key={index} className="recommendation-card">
                    <div className="card-number">{index + 1}</div>
                    <div className="card-image-placeholder">
                      <img
                        src="/process-preparing-espresso-professional-coffee-machine-closeup.jpg"
                        alt={drink}
                      />
                    </div>
                    <h4 className="drink-name">{drink}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.length === 0 && !loading && !error && selectedPreferences.length > 0 && (
            <div className="no-results">
              Click "Get Recommendation" to see our suggestions based on your preferences
            </div>
          )}
        </div>
      </section>

      <section className="ContactsPage">
        <div className="fade-in">
          <img src="/PHOTO1.jpg" alt="Team" className="GroupPhoto" />
        </div>
        <p className="contact-tagline fade-in">Visit us for your daily dose of inspiration.</p>
      </section>

      <footer id="footer-info" className="site-footer fade-in">
        <div className="footer-container">
          <div className="footer-main-content">
            <div className="footer-brand">
              <h2 className="footer-logo">Club C<span>.</span></h2>
              <p className="footer-motto">THE ART OF SLOWING DOWN</p>
            </div>
            <div className="footer-info-grid">
              <div className="info-col">
                <h4>Hours</h4>
                <p>6:00 PM - 11:00 PM</p>
                <p className="status-text">Open every day except Wednesday</p>
              </div>
              <div className="info-col">
                <h4>Location</h4>
                <p>Crisostomo St. Poblacion 1</p>
                <p>Pagsanjan, Laguna</p>
              </div>
              <div className="info-col">
                <h4>Connect</h4>
                <a href="https://www.facebook.com/profile.php?id=61558218781807" target="_blank" rel="noopener noreferrer" className="footer-link-item">FB: CLUB__CRISOSTOMO</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-divider"></div>
            <p>&copy; {new Date().getFullYear()} Club Crisostomo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomepageMain;
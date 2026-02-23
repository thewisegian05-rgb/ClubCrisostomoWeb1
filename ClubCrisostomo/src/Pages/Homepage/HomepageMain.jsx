import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

const HomepageMain = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("show");
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="homepage-container">
      {/* UPDATED NAV BAR FOR CENTERING & CLICKABLE LOGO */}
      <nav className="navBar">
        <div className="nav-left">
          <Link to="/" className="logo-link">
            <h1 className="Logo">Club C.</h1>
          </Link>
        </div>
        
        <div className="nav-buttons-centered">
          <Link to="/menu" className="nav-link-animated">Full Menu</Link>
          <a href="#footer-info" className="nav-link-animated">Contact</a>
        </div>

        <div className="nav-right">
           {/* Spacer to maintain center alignment */}
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
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Fetch the updated credentials from Settings
    // (If you haven't changed it yet, it defaults to Admin@gmail.com and 1234)
    const savedAdminEmail = localStorage.getItem('clubC_admin_email') || "Admin@gmail.com";
    const savedAdminPass = localStorage.getItem('clubC_admin_password') || "1234";

    // --- STRICT ADMIN LOGIN ---
    if (credentials.username === savedAdminEmail && credentials.password === savedAdminPass) {
      navigate("/admin"); 
    } 
    // --- STAFF LOGIN ---
    else if (credentials.username === "staff" && credentials.password === "1234") {
      navigate("/staff/dashboard"); // Fixed this line to match App.jsx
    } 
    // --- ERROR ---
    else {
      alert("Invalid credentials! Please check your email/username and password.");
    }
  };

  useEffect(() => {
    const card = document.querySelector(".login-card");
    if (card) {
      setTimeout(() => card.classList.add("show"), 100);
    }
  }, []);

  return (
    <div className="login-container">
      <div className="login-card fade-in">
        <div className="login-header">
          <h1 className="Logo">Club C<span>.</span></h1>
          <p className="login-subtitle">INTERNAL PORTAL</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Admin Email / Staff ID</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              value={credentials.username} 
              onChange={handleChange} 
              required 
              placeholder="e.g. Admin@gmail.com"
              autoComplete="off"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={credentials.password} 
              onChange={handleChange} 
              required 
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="login-button">Access Portal</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
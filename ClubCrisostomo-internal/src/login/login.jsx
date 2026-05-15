import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase.js"; // <-- Import your Firebase setup
import { signInWithEmailAndPassword } from "firebase/auth"; // <-- Import Firebase login function
import "./login.css";

const Login = () => {
  // Note: Changed "username" to "email" to match Firebase rules
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 1. Send the email and password to Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      const loggedInEmail = userCredential.user.email;

      // 2. Check who just logged in, and route them to the correct dashboard!
      if (loggedInEmail.includes("admin")) {
        navigate("/admin"); 
      } else {
        navigate("/staff/dashboard"); 
      }

    } catch (error) {
      // If Firebase rejects the password or email, show an error
      console.error(error.message);
      alert("Invalid credentials! Please check your email and password.");
    }
  };

  // Fade-in animation
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
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={credentials.email} 
              onChange={handleChange} 
              required 
              placeholder="e.g. admin@clubc.com"
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
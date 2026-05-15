import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Components/Login/Login.css"; // We can reuse the same CSS file!

// Import Firebase Auth tools
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      // 1. Create the user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Add their name to their Firebase profile
      await updateProfile(user, { displayName: name });

      // 3. Send the Verification Email
      await sendEmailVerification(user);

      // 4. Show success message (Don't navigate away yet, let them read it!)
      setSuccessMsg("Account created! Please check your email inbox to verify your account before logging in.");
      
      // Optional: Automatically clear the form
      setName("");
      setEmail("");
      setPassword("");

    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Try logging in instead.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. It must be at least 6 characters.");
      } else {
        setError("Failed to create an account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <Link to="/" className="back-to-home">
        &larr; Back to Home
      </Link>

      <div className="login-card fade-in-login">
        <div className="login-header">
          <h1 className="login-logo">Club C<span>.</span></h1>
          <p className="login-subtitle">Join the club. Slow down with us.</p>
        </div>

        {error && <div className="login-error-msg">{error}</div>}
        
        {/* NEW: Success Message Styling (We will add this CSS later) */}
        {successMsg && <div className="login-success-msg">{successMsg}</div>}

        <form onSubmit={handleSignup} className="login-form">
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <div className="password-header">
              <label htmlFor="password">Password</label>
            </div>
            <input
              type="password"
              id="password"
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <button 
            type="submit" 
            className="login-submit-btn"
            disabled={isLoading || successMsg !== ""}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <Link to="/login" className="signup-link">Log in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
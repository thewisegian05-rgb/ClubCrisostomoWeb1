import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase.js'; // <-- Bringing in your Firebase connection
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Prevents flickers while checking login status

  useEffect(() => {
    // This is a built-in Firebase listener. It watches for logins/logouts!
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Simple trick: If the email contains 'admin', they are an admin. Otherwise, staff.
        const role = currentUser.email.includes('admin') ? 'admin' : 'staff';
        
        // Save the Firebase user data PLUS our custom role
        setUser({ email: currentUser.email, uid: currentUser.uid, role: role });
      } else {
        setUser(null); // Nobody is logged in
      }
      setLoading(false); // Done checking
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // New logout function uses Firebase
  const logout = () => {
    signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {/* Don't render the app until Firebase finishes checking who is logged in */}
      {!loading && children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
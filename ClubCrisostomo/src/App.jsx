import { useEffect } from "react"; 
import { Routes, Route } from "react-router-dom";
import HomepageMain from "./Pages/Homepage/HomepageMain.jsx";
import MenupageMain from "./Pages/Menupage/MenupageMain.jsx";
import CartpageMain from "./Pages/Cartpage/CartpageMain.jsx";
import PaymentpageMain from "./Pages/Paymentpage/PaymentpageMain.jsx";
import Login from "./Pages/Login/Login.jsx";
import Signup from "./Pages/Signup/Signup.jsx"; // <-- 1. ADDED SIGNUP IMPORT
import Profile from "./Pages/Profile/Profile.jsx"; 

// Import your Firebase db and Firestore functions
import { db } from "./firebase"; 
import { collection, getDocs } from "firebase/firestore";

function App() {

  // Add the connection test right here, before the return statement
  useEffect(() => {
    const testConnection = async () => {
      try {
        // IMPORTANT: Replace "menuItems" with an actual collection name that exists in your Firebase database
        const querySnapshot = await getDocs(collection(db, "menuItems"));
        
        console.log("🔥 Firebase Connection Successful! Data found:");
        querySnapshot.forEach((doc) => {
          console.log(doc.id, doc.data());
        });
      } catch (error) {
        console.error("❌ Firebase connection failed: ", error);
      }
    };

    testConnection();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomepageMain />} />
      <Route path="/menu" element={<MenupageMain />} />
      <Route path="/cart" element={<CartpageMain />} />
      <Route path="/payment" element={<PaymentpageMain />} />
      <Route path="/login" element={<Login />} /> 
      <Route path="/signup" element={<Signup />} /> {/* <-- 2. ADDED SIGNUP ROUTE */}
      <Route path="/profile" element={<Profile />} /> 
    </Routes>
  );
}

export default App;
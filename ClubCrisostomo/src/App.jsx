import { useEffect } from "react"; // <-- 1. Import useEffect
import { Routes, Route } from "react-router-dom";
import HomepageMain from "./Pages/Homepage/HomepageMain.jsx";
import MenupageMain from "./Pages/Menupage/MenupageMain.jsx";
import CartpageMain from "./Pages/Cartpage/CartpageMain.jsx";
import PaymentpageMain from "./Pages/Paymentpage/PaymentpageMain.jsx";

// 2. Import your Firebase db and Firestore functions
import { db } from "./firebase"; // Make sure this path points to your firebase.jsx file
import { collection, getDocs } from "firebase/firestore";

function App() {

  // 3. Add the connection test right here, before the return statement
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
    </Routes>
  );
}

export default App;
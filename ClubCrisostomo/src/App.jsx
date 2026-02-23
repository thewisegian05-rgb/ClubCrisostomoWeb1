import { Routes, Route } from "react-router-dom";
import HomepageMain from "./Pages/Homepage/HomepageMain.jsx";
import MenupageMain from "./Pages/Menupage/MenupageMain.jsx";
import CartpageMain from "./Pages/Cartpage/CartpageMain.jsx";
import PaymentpageMain from "./Pages/Paymentpage/PaymentpageMain.jsx";

function App() {
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
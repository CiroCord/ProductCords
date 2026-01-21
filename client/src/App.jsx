import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, useLocation  } from "react-router-dom";

import './App.css'
import Header from "./components/includes/NavBar/Header";
import Espectacular from './components/Pages/inicio/Espectacular';
import IngresarProducto from './components/Pages/inicio/productos/IngresarProducto';
import ProductList from './components/Pages/inicio/productos/muestraProductos';
import ProductDetail from './components/Pages/inicio/productos/EspecificacionProducto';
import AdminPanel from './components/Pages/sectionManager/AdminPanel';
import Auth from './components/Pages/user/Auth';
import ForgotPassword from './components/Pages/user/ForgotPassword';
import ResetPassword from './components/Pages/user/ResetPassword';
import EditProfile from './components/Pages/user/EditProfile';
import Favorites from './components/Pages/inicio/productos/Favorites';
import AllProducts from './components/Pages/AllProducts';
import Checkout from './components/Pages/pagos/Checkout';
import PaymentStatus from './components/Pages/pagos/PaymentStatus';
import MyOrders from './components/Pages/user/MyOrders';
import MuestraCategorias from './components/Pages/inicio/productos/MuestraCategorias';
import Fotter from './components/includes/Fotter'
// import Footer from "./components/includes/Fotter";
// import OffcanvasCart from "./components/includes/NavBar/OffcanvasCart";
// import OffcanvasSearch from "./components/includes/NavBar/OffcanvasSearch";

const Rutas = () => {
  const location = useLocation();
  return (
      <div>
        {!(location.pathname == "/login"|| location.pathname == "/admin")  ? <Header />:''}
        <Routes>
          <Route path="/" element={
            <>
              <Espectacular/>
              <MuestraCategorias/>
              <ProductList/>
            </>
          } />
          <Route path="/product/:id" element={<ProductDetail/>} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/login" element={<Auth/>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
          <Route path="/edit-profile" element={<EditProfile />}/>
          <Route path="/favorites" element={<Favorites />}/>
          <Route path="/catalogo" element={<AllProducts />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<PaymentStatus status="success" />} />
          <Route path="/checkout/failure" element={<PaymentStatus status="failure" />} />
          <Route path="/checkout/pending" element={<PaymentStatus status="pending" />} />
          <Route path="/my-orders" element={<MyOrders />} />
          </Routes>
          {!(location.pathname == "/login"|| location.pathname == "/admin")  ? <Fotter />:''}
      </div>
      
    
  );
};
const App = ()=>{
  return(
  <Router>
    <Rutas></Rutas>
  </Router>
  )
}
export default App;
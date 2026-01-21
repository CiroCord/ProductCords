import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../../styles/normalize.css";
import "../../../styles/vendor.css";
import "../../../styles/style.css";

const OffcanvasCart = ({ user, refreshCart }) => {
  const navigate = useNavigate();
  const [placement, setPlacement] = useState('end');

  useEffect(() => {
    const handleResize = () => {
      setPlacement(window.innerWidth < 992 ? 'bottom' : 'end');
    };
    handleResize(); // Chequeo inicial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  
  const cartItems = user?.productosCarrito || [];

 
  const total = cartItems.reduce((acc, item) => {
   
    const price = item.product?.precioDescuento 
      ? (item.product.precioOriginal - (item.product.precioOriginal * item.product.precioDescuento / 100)) 
      : item.product?.precioOriginal || 0;
    return acc + (price * item.quantity);
  }, 0);

  const handleRemove = async (productId) => {
    if (!user?._id) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/cart/${user._id}/${productId}`);
      refreshCart(); // Recargar el usuario para actualizar el carrito
    } catch (error) {
      console.error("Error al eliminar producto", error);
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (!user?._id || newQuantity < 1) return;
    try {
      await axios.put(`http://localhost:5000/api/users/cart/${user._id}/${productId}`, { quantity: newQuantity });
      refreshCart();
    } catch (error) {
      console.error("Error al actualizar cantidad", error);
    }
  };

  const handleClearCart = async () => {
    if (!user?._id) return;
    
      try {
        await axios.delete(`http://localhost:5000/api/users/cart/${user._id}`);
        refreshCart();
      } catch (error) {
        console.error("Error al vaciar el carrito", error);
      }
    
  };

  const handleCheckout = () => {
    
    const closeBtn = document.querySelector('#offcanvasCart .btn-close');
    if(closeBtn) closeBtn.click();
    navigate('/checkout');
  };

  return (
    <>
      {/* Botón para abrir el carrito */}
       <div className="cart text-end d-none d-lg-block dropdown">
                    <button
                      className="border-0 bg-transparent d-flex flex-column gap-2 lh-1"
                      type="button"
                      data-bs-toggle="offcanvas"
                      data-bs-target="#offcanvasCart"
                      aria-controls="offcanvasCart"
                    >
                      <span className="fs-6 text-muted dropdown-toggle">Tu Carrito</span>
                      <span className="cart-total fs-5 fw-bold">${total.toFixed(2)}</span>
                    </button>
                  </div>

      {/* Offcanvas (carrito) */}
      <div
        className={`offcanvas offcanvas-${placement}`}
        data-bs-scroll="true"
        tabIndex="-1"
        id="offcanvasCart"
        aria-labelledby="Mi Carrito"
        style={{ height: placement === 'bottom' ? '85vh' : undefined, borderRadius: placement === 'bottom' ? '1.5rem 1.5rem 0 0' : undefined }}
      >
        <div className="offcanvas-header justify-content-center">
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"  
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          <div className="order-md-last">
            <h4 className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-primary">Tu Carrito</span>
              <span className="badge bg-primary rounded-pill">{cartItems.length}</span>
            </h4>
            <ul className="list-group mb-3">
              
              {cartItems.length > 0 ? (
                cartItems.map((item) => {
                  if (!item.product) return null; 
                  const price = item.product.precioDescuento 
                    ? (item.product.precioOriginal - (item.product.precioOriginal * item.product.precioDescuento / 100)) 
                    : item.product.precioOriginal;

                  return (
                    <li className="list-group-item d-flex justify-content-between lh-sm align-items-center" key={item._id || item.product._id}>
                      <div style={{ flex: 1 }}>
                        <h6 className="my-0">{item.product.nombre}</h6>
                        <small className="text-body-secondary">Cant: 
                          <button className="btn btn-sm btn-outline-secondary mx-1 py-0" onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}>-</button>
                          {item.quantity}
                          <button className="btn btn-sm btn-outline-secondary mx-1 py-0" onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}>+</button>
                        </small>
                      </div>
                      <div className="text-end">
                        <span className="text-body-secondary d-block">${(price * item.quantity).toFixed(2)}</span>
                        <button 
                          className="btn text-danger p-0" 
                          onClick={() => handleRemove(item.product._id)}
                          title="Eliminar producto"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" color="red"><use xlinkHref="/icon.svg#trash"></use></svg>
                        </button>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="list-group-item text-center">El carrito está vacío</li>
              )}

              <li className="list-group-item d-flex justify-content-between">
                <span>Total (ARS)</span>
                <strong>${total.toFixed(2)}</strong>
              </li>
            </ul>

            <button 
              className="w-100 btn btn-primary btn-lg" 
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
            >
              Pagar
            </button>
            <button 
              className="w-100 btn btn-outline-danger mt-2" 
              onClick={handleClearCart}
              disabled={cartItems.length === 0}
            >
              Vaciar Carrito
            </button>
          </div>
        </div> 
      </div>
    </> 
  );
};

export default OffcanvasCart;

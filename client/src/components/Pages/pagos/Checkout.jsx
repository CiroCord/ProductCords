import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import PaymentStatus from './PaymentStatus';

// Inicializa con tu PUBLIC_KEY de Mercado Pago
// Nota: Se utilizan credenciales APP_USR-. Para pruebas, asegúrate de loguearte con un Usuario de Prueba (Test User).
initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, {
    locale: 'es-AR' // Ajusta a tu país
});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const Checkout = () => {
    const [preferenceId, setPreferenceId] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [missingData, setMissingData] = useState(false);
    const [formData, setFormData] = useState({ telefono: '', provincia: '', localidad: '' });
    const navigate = useNavigate();
    const location = useLocation();

    // Si hay un status en la URL, mostramos el componente de estado y no cargamos el checkout
    const query = new URLSearchParams(location.search);
    // Mercado Pago a veces devuelve 'status' y a veces 'collection_status'
    const statusParam = query.get("status") || query.get("collection_status");

    useEffect(() => {
        if (statusParam) return; // No cargar carrito si estamos volviendo de MP

        const fetchCart = async () => {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                navigate('/login');
                return;
            }
            const user = JSON.parse(storedUser);

            try {
                // Obtenemos el carrito actualizado del usuario
                const res = await axios.get(`${BACKEND_URL}/api/users/${user.id}`);
                const userData = res.data;

                if (!userData.telefono || !userData.provincia || !userData.localidad) {
                    setMissingData(true);
                    setFormData({
                        telefono: userData.telefono || '',
                        provincia: userData.provincia || '',
                        localidad: userData.localidad || ''
                    });
                }

                const items = res.data.productosCarrito || [];
                setCartItems(items);

                // Calcular total localmente para mostrar
                const calcTotal = items.reduce((acc, item) => {
                    const price = item.product.precioDescuento 
                        ? (item.product.precioOriginal * (1 - item.product.precioDescuento / 100)) 
                        : item.product.precioOriginal;
                    return acc + (price * item.quantity);
                }, 0);
                setTotal(calcTotal);

                // Crear la preferencia de pago en el backend
                if (items.length > 0) {
                    const paymentRes = await axios.post(`${BACKEND_URL}/api/payment/create_preference`, {
                        userId: user.id
                    });
                    setPreferenceId(paymentRes.data.id);
                }
            } catch (error) {
                console.error("Error al cargar el checkout:", error);
                setError(error.response?.data?.message || "Hubo un error al iniciar el pago. Revisa la consola del servidor.");
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, [navigate, statusParam]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) return;
            const user = JSON.parse(storedUser);
            await axios.put(`${BACKEND_URL}/api/users/${user.id}`, formData);
            setMissingData(false);
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Error al guardar los datos.");
        }
    };

    if (statusParam) {
        return <PaymentStatus status={statusParam} />;
    }

    if (loading) return <div className="container py-5 text-center"><h3>Cargando checkout...</h3></div>;

    return (
        <div className="container py-5">
            <h2 className="mb-4 fw-bold">Finalizar Compra</h2>
            <div className="row">
                {/* Columna Izquierda: Resumen de Items */}
                <div className="col-md-7 mb-4">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white fw-bold">Tu Pedido</div>
                        <ul className="list-group list-group-flush">
                            {cartItems.map((item) => {
                                const price = item.product.precioDescuento 
                                    ? (item.product.precioOriginal * (1 - item.product.precioDescuento / 100)) 
                                    : item.product.precioOriginal;
                                return (
                                    <li key={item._id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-3">
                                            <img src={item.product.image} alt={item.product.nombre} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px'}} />
                                            <div>
                                                <h6 className="my-0">{item.product.nombre}</h6>
                                                <small className="text-muted">Cantidad: {item.quantity}</small>
                                            </div>
                                        </div>
                                        <span className="text-muted">${(price * item.quantity).toFixed(2)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                {/* Columna Derecha: Total y Pago */}
                <div className="col-md-5">
                    <div className="card shadow border-0 bg-light">
                        <div className="card-body p-4">
                            <h4 className="d-flex justify-content-between align-items-center mb-3">
                                <span className="text-primary">Total a Pagar</span>
                                <span className="fw-bold">${total.toFixed(2)}</span>
                            </h4>
                            <hr />
                            <p className="small text-muted mb-4">
                                Al continuar, serás redirigido a Mercado Pago para completar tu compra de forma segura.
                                Aceptamos tarjetas de crédito, débito y efectivo.
                            </p>
                            
                            {missingData ? (
                                <div className="alert alert-warning">
                                    <h5 className="alert-heading h6">Datos requeridos</h5>
                                    <p className="mb-2 small">Por favor completa tu información de contacto y envío para continuar.</p>
                                    <form onSubmit={handleUpdateUser}>
                                        <div className="mb-2">
                                            <input type="text" name="telefono" className="form-control form-control-sm" placeholder="Teléfono" value={formData.telefono} onChange={handleInputChange} required />
                                        </div>
                                        <div className="mb-2">
                                            <input type="text" name="provincia" className="form-control form-control-sm" placeholder="Provincia" value={formData.provincia} onChange={handleInputChange} required />
                                        </div>
                                        <div className="mb-2">
                                            <input type="text" name="localidad" className="form-control form-control-sm" placeholder="Localidad" value={formData.localidad} onChange={handleInputChange} required />
                                        </div>
                                        <button type="submit" className="btn btn-warning btn-sm w-100">Guardar y Continuar</button>
                                    </form>
                                </div>
                            ) : (
                                preferenceId ? (
                                <Wallet 
                                    initialization={{ preferenceId: preferenceId, redirectMode: 'self' }} 
                                    customization={{ texts:{ valueProp: 'smart_option'}}} 
                                    onError={(error) => console.error("Error en Wallet de MP:", error)}
                                />
                            ) : (
                                <div className="alert alert-warning">{error || "No se pudo iniciar el pago. Intenta nuevamente."}</div>
                            )
                            )}
                            
                            <button className="btn btn-link text-muted w-100 mt-2" onClick={() => navigate('/')}>
                                Volver a la tienda
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;

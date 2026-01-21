import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const PaymentStatus = ({ status }) => {
    const [searchParams] = useSearchParams();
    // MP puede devolver payment_id o collection_id
    const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
    const [processed, setProcessed] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const processing = useRef(false); // Candado para evitar doble ejecución

    useEffect(() => {
        if ((status === 'success' || status === 'approved') && paymentId && !processed && !processing.current) {
            processing.current = true; // Bloqueamos inmediatamente
            const processOrder = async () => {
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    const userId = user._id || user.id; // Aseguramos obtener el ID correcto
                    try {
                        // 1. Obtener carrito para calcular total antes de borrarlo
                        const userRes = await axios.get(`${BACKEND_URL}/api/users/${userId}`);
                        const items = userRes.data.productosCarrito || [];

                        // Evitar duplicar orden si el usuario recarga y el carrito ya está vacío
                        if (items.length === 0) {
                            setProcessed(true);
                            return;
                        }
                        
                        const total = items.reduce((acc, item) => {
                            if (!item.product) return acc; // Protección si el producto fue borrado
                            const price = item.product.precioDescuento 
                                ? (item.product.precioOriginal * (1 - item.product.precioDescuento / 100)) 
                                : item.product.precioOriginal;
                            return acc + (price * item.quantity);
                        }, 0);

                        // 2. Crear el pedido
                        await axios.post(`${BACKEND_URL}/api/orders`, {
                            userId: userId,
                            paymentId: paymentId,
                            status: 'approved',
                            total: total
                        });

                        // 3. Vaciar el carrito
                        await axios.delete(`${BACKEND_URL}/api/users/cart/${userId}`);
                        
                        // 4. Actualizar reporte de ventas (BI)
                        try {
                            await axios.post(`${BACKEND_URL}/api/status/generate`);
                        } catch (err) {
                            console.error("No se pudo actualizar el reporte de BI:", err);
                        }

                        // Disparar evento para que el Header actualice el contador a 0
                        window.dispatchEvent(new Event('cartUpdated'));
                        setProcessed(true);
                    } catch (error) {
                        console.error("Error al procesar pedido:", error);
                        setSaveError("El pago fue aprobado, pero hubo un error al registrar el pedido. Por favor contáctanos.");
                    }
                }
            };
            processOrder();
        }
    }, [status, paymentId, processed]);

    return (
        <div className="container py-5 text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {/* 1. Mostrar error si falló el guardado del pedido */}
            {saveError && (
                <div className="card shadow-sm p-5 border-warning" style={{ maxWidth: '500px' }}>
                    <div className="mb-3 text-warning">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <h2 className="fw-bold text-warning mb-3">Atención</h2>
                    <p className="text-muted">{saveError}</p>
                    <p className="small text-muted">ID de Pago: {paymentId}</p>
                    <Link to="/" className="btn btn-primary mt-3 w-100">Volver al inicio</Link>
                </div>
            )}

            {/* 2. Mostrar Spinner mientras se procesa (Pago OK, pero processed false y sin error) */}
            {!saveError && (status === 'success' || status === 'approved') && !processed && (
                <div className="text-center">
                    <div className="spinner-border text-primary mb-4" role="status" style={{width: '3rem', height: '3rem'}}>
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <h3 className="fw-bold text-primary">Finalizando tu compra...</h3>
                    <p className="text-muted">Estamos registrando tu pedido, por favor no cierres esta ventana.</p>
                </div>
            )}

            {/* 3. Mostrar Éxito solo cuando processed es true */}
            {!saveError && (status === 'success' || status === 'approved') && processed && (
                <div className="card shadow-sm p-5 border-success" style={{ maxWidth: '500px' }}>
                    <div className="mb-3 text-success">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <h2 className="fw-bold text-success mb-3">¡Pago Exitoso!</h2>
                    <p className="text-muted">Tu compra se ha procesado correctamente.</p>
                    <p className="small text-muted">ID de operación: {paymentId}</p>
                    <Link to="/" className="btn btn-success mt-3 w-100">Volver a la tienda</Link>
                </div>
            )}
            
            {(status === 'failure' || status === 'rejected') && (
                <div className="card shadow-sm p-5 border-danger" style={{ maxWidth: '500px' }}>
                    <div className="mb-3 text-danger">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </div>
                    <h2 className="fw-bold text-danger mb-3">Pago No Completado</h2>
                    <p className="text-muted">Hubo un problema al procesar tu pago.</p>
                    <Link to="/checkout" className="btn btn-outline-danger mt-3 w-100">Intentar nuevamente</Link>
                </div>
            )}

            {status === 'pending' && (
                <div className="card shadow-sm p-5 border-warning" style={{ maxWidth: '500px' }}>
                    <div className="mb-3 text-warning">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <h2 className="fw-bold text-warning mb-3">Pago Pendiente</h2>
                    <p className="text-muted">Tu pago está siendo procesado. Te avisaremos cuando se complete.</p>
                    <Link to="/" className="btn btn-primary mt-3 w-100">Volver a la tienda</Link>
                </div>
            )}

            {/* Caso por defecto para evitar pantalla blanca si llega un estado desconocido */}
            {status !== 'success' && status !== 'approved' && status !== 'failure' && status !== 'rejected' && status !== 'pending' && (
                <div className="card shadow-sm p-5" style={{ maxWidth: '500px' }}>
                    <div className="mb-3 text-muted">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </div>
                    <h2 className="fw-bold text-secondary mb-3">Estado Desconocido</h2>
                    <p className="text-muted">No pudimos determinar el estado del pago ({status}). Revisa tu cuenta.</p>
                    <Link to="/" className="btn btn-primary mt-3 w-100">Volver al inicio</Link>
                </div>
            )}
        </div>
    );
};

export default PaymentStatus;

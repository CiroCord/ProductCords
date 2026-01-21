import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from "../user/UserContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showHistory, setShowHistory] = useState(false); // Estado para filtrar entregados
    const { isSpectator, loading: userLoading } = useUser() || { isSpectator: true, loading: true };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            // Asumimos que existe este endpoint para obtener todos los pedidos
            const res = await axios.get(`${BACKEND_URL}/api/orders`);
            setOrders(res.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        // Verificación de Modo Espectador
        if (userLoading) {
            alert("Cargando permisos... Por favor espera un momento.");
            return;
        }
        if (isSpectator) {
            alert("Estás en modo espectador. Los cambios no se guardarán por una cuestión de seguridad. El administrador de la página tiene permiso para hacer estos cambios.");
            return;
        }

        try {
            await axios.put(`${BACKEND_URL}/api/orders/${orderId}/status`, { status: newStatus });
            // Actualizar localmente
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar el estado");
        }
    };

    // --- FUNCIÓN PARA SIMULAR VENTAS (DATA DUMMY) ---
    const handleSimulateOrders = async () => {
        if (userLoading) return;
        if (isSpectator) {
            alert("Modo espectador: No puedes generar datos.");
            return;
        }
        if (!window.confirm("¿Generar 5 pedidos simulados aleatorios? \nEsto usará tu carrito actual temporalmente y generará estadísticas.")) return;
        
        setLoading(true);
        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) return;
            const user = JSON.parse(storedUser);
            
            // 1. Obtener productos para elegir al azar
            const prodRes = await axios.get(`${BACKEND_URL}/api/products`);
            const allProducts = prodRes.data;

            if (allProducts.length === 0) {
                alert("No hay productos para simular ventas.");
                return;
            }

            // Generar 5 pedidos
            for (let i = 0; i < 5; i++) {
                // A. Vaciar carrito previo por seguridad
                await axios.delete(`${BACKEND_URL}/api/users/cart/${user.id}`);

                // B. Agregar 1 a 3 productos random al carrito
                const numItems = Math.floor(Math.random() * 3) + 1;
                let currentTotal = 0;

                for (let j = 0; j < numItems; j++) {
                    const randomProd = allProducts[Math.floor(Math.random() * allProducts.length)];
                    const qty = Math.floor(Math.random() * 2) + 1;
                    
                    await axios.post(`${BACKEND_URL}/api/users/cart/${user.id}`, {
                        productId: randomProd._id,
                        quantity: qty
                    });
                    
                    const price = randomProd.precioDescuento 
                        ? (randomProd.precioOriginal * (1 - randomProd.precioDescuento / 100)) 
                        : randomProd.precioOriginal;
                    currentTotal += price * qty;
                }

                // C. Crear Orden con estados variados
                const statuses = ['approved', 'preparacion', 'camino', 'entregado'];
                const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                
                // Simulamos un ID de pago falso
                await axios.post(`${BACKEND_URL}/api/orders`, {
                    userId: user.id,
                    paymentId: `SIM-${Date.now()}-${i}`,
                    status: randomStatus,
                    total: currentTotal
                });
            }

            // D. Limpieza final y actualización de BI
            await axios.delete(`${BACKEND_URL}/api/users/cart/${user.id}`);
            await axios.post(`${BACKEND_URL}/api/status/generate`);
            
            alert("¡5 Pedidos simulados creados exitosamente!");
            fetchOrders(); // Recargar tabla

        } catch (error) {
            console.error("Error simulando:", error);
            alert("Hubo un error al simular pedidos.");
        } finally {
            setLoading(false);
        }
    };

    // Filtramos los pedidos según el checkbox
    const filteredOrders = orders.filter(order => {
        if (showHistory) return true; // Si está activado, mostramos todo
        return order.status !== 'entregado'; // Si no, ocultamos los entregados
    });

    if (loading) return <div className="p-4 text-center">Cargando pedidos...</div>;

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="m-0">Gestión de Pedidos</h2>
                <div className="d-flex align-items-center gap-3">
                    <div className="form-check form-switch m-0">
                        <input className="form-check-input" type="checkbox" id="showHistory" checked={showHistory} onChange={(e) => setShowHistory(e.target.checked)} />
                        <label className="form-check-label" htmlFor="showHistory">Mostrar Historial (Entregados)</label>
                    </div>
                    <button className="btn btn-warning btn-sm fw-bold" onClick={handleSimulateOrders} disabled={loading}>⚡ Simular Ventas</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={fetchOrders}>Actualizar</button>
                </div>
            </div>
            
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="border-0 p-3">ID Pedido</th>
                                    <th className="border-0 p-3">Cliente</th>
                                    <th className="border-0 p-3">Fecha</th>
                                    <th className="border-0 p-3">Total</th>
                                    <th className="border-0 p-3">Estado</th>
                                    <th className="border-0 p-3">Acciones</th> 
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length > 0 ? filteredOrders.map(order => (
                                    <tr key={order._id || order.id}>
                                        <td className="p-3">
                                            <span className="text-muted font-monospace">#{order._id ? order._id.slice(-6).toUpperCase() : '---'}</span>
                                        </td>
                                        <td className="p-3">
                                            <div className="fw-bold">{order.user?.username || 'Usuario'}</div>
                                            <small className="text-muted d-block">{order.user?.email || 'Sin email'}</small>
                                            {(order.user?.provincia || order.user?.localidad) && (
                                                <small className="text-muted d-block" style={{fontSize: '0.85em'}}>
                                                    📍 {order.user.localidad}{order.user.localidad && order.user.provincia ? ', ' : ''}{order.user.provincia}
                                                </small>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-3 fw-bold">
                                            ${order.total ? order.total.toFixed(2) : '0.00'}
                                        </td>
                                        <td className="p-3">
                                            <select 
                                                className={`form-select form-select-sm border-${order.status === 'approved' ? 'success' : order.status === 'entregado' ? 'dark' : 'warning'}`}
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                            >
                                                <option value="approved">Pagado / Aprobado</option>
                                                <option value="preparacion">En preparación</option>
                                                <option value="camino">En camino</option>
                                                <option value="entregado">Entregado</option>
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedOrder(order)} title="Ver detalles">Ver Productos</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="text-center p-5 text-muted">No hay pedidos pendientes. {orders.length > 0 && !showHistory && "(Revisa el historial)"}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Detalles del Pedido */}
            {selectedOrder && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Detalle del Pedido #{selectedOrder._id.slice(-6).toUpperCase()}</h5>
                                <button type="button" className="btn-close" onClick={() => setSelectedOrder(null)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <h6 className="fw-bold">Datos del Cliente</h6>
                                        <p className="mb-1"><strong>Nombre:</strong> {selectedOrder.user?.username || 'N/A'}</p>
                                        <p className="mb-1"><strong>Email:</strong> {selectedOrder.user?.email}</p>
                                        <p className="mb-1"><strong>Teléfono:</strong> {selectedOrder.user?.telefono || 'N/A'}</p>
                                        <p className="mb-0"><strong>Ubicación:</strong> {selectedOrder.user?.localidad}, {selectedOrder.user?.provincia}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="fw-bold">Resumen</h6>
                                        <p className="mb-1"><strong>Fecha:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                        <p className="mb-1"><strong>Total:</strong> ${selectedOrder.total?.toFixed(2)}</p>
                                        <p className="mb-0"><strong>Estado:</strong> 
                                            {selectedOrder.status === 'approved' ? ' Pagado' : 
                                             selectedOrder.status === 'preparacion' ? ' En preparación' :
                                             selectedOrder.status === 'camino' ? ' En camino' :
                                             selectedOrder.status === 'entregado' ? ' Entregado' :
                                             selectedOrder.status}
                                        </p>
                                    </div>
                                </div>
                                <h6 className="border-bottom pb-2 mb-3 fw-bold">Productos Comprados</h6>
                                <div className="table-responsive">
                                    <table className="table table-sm align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Producto</th>
                                                <th className="text-center">Cant.</th>
                                                <th className="text-end">Precio Unit.</th>
                                                <th className="text-end">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            {item.product?.image && (
                                                                <img src={item.product.image} alt="" style={{width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px'}} />
                                                            )}
                                                            <span>{item.product?.nombre || 'Producto eliminado'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-end">${item.price?.toFixed(2)}</td>
                                                    <td className="text-end">${(item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageOrders;
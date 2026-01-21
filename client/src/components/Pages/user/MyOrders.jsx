import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyOrders = async () => {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                navigate('/login');
                return;
            }
            const user = JSON.parse(storedUser);

            try {
                const res = await axios.get(`http://localhost:5000/api/orders/user/${user.id}`);
                setOrders(res.data);
            } catch (error) {
                console.error("Error fetching user orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyOrders();
    }, [navigate]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="badge bg-success">Pagado</span>;
            case 'preparacion': return <span className="badge bg-warning text-dark">En preparación</span>;
            case 'camino': return <span className="badge bg-info text-dark">En camino</span>;
            case 'entregado': return <span className="badge bg-secondary">Entregado</span>;
            default: return <span className="badge bg-secondary">{status}</span>;
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case 'approved': return "Hemos recibido tu pago. Pronto comenzaremos a preparar tu pedido.";
            case 'preparacion': return "Estamos armando tu paquete con cuidado.";
            case 'camino': return "¡Tu pedido está en camino! Llegará pronto a tu dirección.";
            case 'entregado': return "El pedido ha sido entregado. ¡Gracias por tu compra!";
            default: return "";
        }
    };

    if (loading) return <div className="container py-5 text-center"><h3>Cargando tus pedidos...</h3></div>;

    return (
        <div className="container py-5">
            <h2 className="mb-4 fw-bold">Mis Pedidos</h2>
            
            {orders.length === 0 ? (
                <div className="alert alert-info">No tienes pedidos registrados.</div>
            ) : (
                <div className="row">
                    {orders.map(order => (
                        <div key={order._id} className="col-12 mb-4">
                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                                    <div>
                                        <span className="fw-bold me-2">Pedido #{order._id.slice(-6).toUpperCase()}</span>
                                        <small className="text-muted">{new Date(order.createdAt).toLocaleDateString()}</small>
                                    </div>
                                    {getStatusBadge(order.status)}
                                </div>
                                <div className="card-body">
                                    <p className="text-muted mb-3 fst-italic">{getStatusMessage(order.status)}</p>
                                    
                                    <div className="table-responsive">
                                        <table className="table table-sm align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Producto</th>
                                                    <th className="text-center">Cant.</th>
                                                    <th className="text-end">Precio</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                {item.product?.image && (
                                                                    <img src={item.product.image} alt="" style={{width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px'}} />
                                                                )}
                                                                <span>{item.product?.nombre || 'Producto no disponible'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">{item.quantity}</td>
                                                        <td className="text-end">${item.price.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="2" className="text-end fw-bold">Total:</td>
                                                    <td className="text-end fw-bold">${order.total.toFixed(2)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrders;

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs, Zoom, Pagination } from 'swiper/modules';

// Estilos de Swiper
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/zoom';
import 'swiper/css/pagination';

import "../../../../styles/style.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para la galería y carrito
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: '' }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error(error);
        setError("No se pudo cargar el producto.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (val) => {
    const newVal = quantity + val;
    if (newVal >= 1) setQuantity(newVal);
  };

  const addToCart = async () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
        setNotification({ type: 'error', message: 'Debes iniciar sesión para comprar.' });
        setTimeout(() => setNotification(null), 3000);
        return;
    }

    const user = JSON.parse(userStr);
    setAdding(true);

    try {
        await axios.post(`${BACKEND_URL}/api/users/cart/${user.id}`, {
            productId: product._id,
            quantity: quantity
        });
        
        setNotification({ type: 'success', message: `¡${quantity} ${product.nombre} agregado(s) al carrito!` });
        
        // Disparar evento para actualizar header si existe listener
        window.dispatchEvent(new Event('cartUpdated'));

    } catch (error) {
        console.error(error);
        setNotification({ type: 'error', message: 'Error al agregar al carrito.' });
    } finally {
        setAdding(false);
        setTimeout(() => setNotification(null), 3000);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div>
    </div>
  );

  if (error || !product) return (
    <div className="container py-5 text-center">
        <h3>{error || "Producto no encontrado"}</h3>
        <Link to="/" className="btn btn-primary mt-3">Volver al inicio</Link>
    </div>
  );

  // Preparar imágenes: Unimos la principal con las secundarias y filtramos nulos
  const images = [product.image, ...(product.images || [])].filter(Boolean);
  // Si no hay imágenes, poner placeholder
  if (images.length === 0) images.push("https://placehold.co/600x600?text=Sin+Imagen");

  // Calcular precio final
  const precioFinal = product.precioDescuento 
    ? (product.precioOriginal * (1 - product.precioDescuento / 100))
    : product.precioOriginal;

  // Obtener nombre de categoría de forma segura (soporta string u objeto)
  const categoriaNombre = typeof product.categoria === 'object' ? product.categoria?.nombre : product.categoria;

  return (
    <section className="product-detail-section pb-5 mb-5">
        {/* Notificación Flotante */}
        {notification && (
            <div className="cart-notification" style={{ backgroundColor: notification.type === 'error' ? '#dc3545' : '#28a745' }}>
                {notification.type === 'success' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                {notification.message}
            </div>
        )}

        <div className="container">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted">Inicio</Link></li>
                    <li className="breadcrumb-item"><Link to="/catalogo" className="text-decoration-none text-muted">Catálogo</Link></li>
                    {categoriaNombre && <li className="breadcrumb-item active text-capitalize" aria-current="page">{categoriaNombre}</li>}
                    <li className="breadcrumb-item active text-truncate" aria-current="page" style={{maxWidth: '200px'}}>{product.nombre}</li>
                </ol>
            </nav>

            <div className="row g-5 mb-5">
                {/* --- COLUMNA IZQUIERDA: GALERÍA --- */}
                <div className="col-lg-6">
                    <div className="product-gallery position-relative sticky-top" style={{top: '100px', zIndex: 1}}>
                        {/* Slider Principal */}
                        <Swiper
                            style={{
                                '--swiper-navigation-color': '#5a5a5a',
                                '--swiper-pagination-color': '#ffc43f',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '1px solid #f0f0f0',
                                boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
                            }}
                            spaceBetween={10}
                            navigation={true}
                            pagination={{ clickable: true }}
                            zoom={true}
                            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                            modules={[FreeMode, Navigation, Thumbs, Zoom, Pagination]}
                            className="mb-3 bg-white"
                        >
                            {images.map((img, idx) => (
                                <SwiperSlide key={idx}>
                                    {/* Contenedor de Zoom requerido por Swiper */}
                                    <div className="swiper-zoom-container" style={{height: '500px', padding: '20px'}}>
                                        <img src={img} alt={`${product.nombre} - vista ${idx+1}`} style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'contain'}} />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>

                        {/* Miniaturas (Thumbs) */}
                        {images.length > 1 && (
                            <Swiper
                                onSwiper={setThumbsSwiper}
                                spaceBetween={10}
                                slidesPerView={4}
                                freeMode={true}
                                watchSlidesProgress={true}
                                modules={[FreeMode, Navigation, Thumbs]}
                                className="thumbs-gallery px-1"
                                breakpoints={{
                                    320: { slidesPerView: 3 },
                                    480: { slidesPerView: 4 },
                                    992: { slidesPerView: 5 }
                                }}
                            >
                                {images.map((img, idx) => (
                                    <SwiperSlide key={idx} style={{opacity: 0.5, transition: '0.3s', cursor: 'pointer', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden'}}>
                                        <div style={{width: '100%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff'}}>
                                            <img src={img} alt="thumb" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        )}
                        <div className="text-center mt-2 text-muted small">
                            <i className="bi bi-zoom-in me-1"></i> Doble clic en la imagen para hacer zoom
                        </div>
                    </div>
                </div>

                {/* --- COLUMNA DERECHA: INFORMACIÓN --- */}
                <div className="col-lg-6">
                    <div className="product-info ps-lg-4">
                        {categoriaNombre && <span className="badge bg-warning text-dark mb-3 px-3 py-2 rounded-pill">{categoriaNombre}</span>}
                        
                        <h1 className="display-5 fw-bold mb-3 text-dark">{product.nombre}</h1>
                        
                        {/* Precio */}
                        <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3">
                            <h2 className="text-primary fw-bold mb-0 display-6">${Number(precioFinal).toFixed(2)}</h2>
                            {product.precioDescuento > 0 && (
                                <div className="d-flex flex-column border-start ps-3">
                                    <span className="text-decoration-line-through text-muted">${Number(product.precioOriginal).toFixed(2)}</span>
                                    <span className="text-success small fw-bold text-uppercase">{product.precioDescuento}% OFF</span>
                                </div>
                            )}
                        </div>

                        {/* Descripción */}
                        <div className="mb-4">
                            <h5 className="fw-bold">Descripción</h5>
                            <p className="text-muted" style={{fontSize: '1.05rem', lineHeight: '1.8'}}>
                                {product.descripcion || "Sin descripción disponible para este producto."}
                            </p>
                        </div>

                        {/* Detalles Técnicos (Peso / Tiempo) */}
                        <div className="row mb-5 g-3">
                            {product.peso && (
                                <div className="col-6 col-sm-4">
                                    <div className="p-3 border rounded bg-white text-center h-100 shadow-sm">
                                        <small className="d-block text-muted text-uppercase fw-bold mb-1" style={{fontSize: '0.7rem'}}>Peso</small>
                                        <span className="fw-bold fs-5">{product.peso}g</span>
                                    </div>
                                </div>
                            )}
                            {product.tiempo && (
                                <div className="col-6 col-sm-4">
                                    <div className="p-3 border rounded bg-white text-center h-100 shadow-sm">
                                        <small className="d-block text-muted text-uppercase fw-bold mb-1" style={{fontSize: '0.7rem'}}>Entrega</small>
                                        <span className="fw-bold fs-5">{product.tiempo} días</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Acciones de Compra */}
                        <div className="d-flex flex-wrap align-items-center gap-3 pb-4 border-bottom">
                            <div className="input-group" style={{width: '150px'}}>
                                <button className="btn btn-outline-secondary" type="button" onClick={() => handleQuantityChange(-1)}>-</button>
                                <input type="text" className="form-control text-center border-secondary fw-bold" value={quantity} readOnly />
                                <button className="btn btn-outline-secondary" type="button" onClick={() => handleQuantityChange(1)}>+</button>
                            </div>

                            <button 
                                className="btn btn-primary btn-lg px-5 flex-grow-1 fw-bold shadow-sm" 
                                onClick={addToCart}
                                disabled={adding}
                                style={{minHeight: '50px'}}
                            >
                                {adding ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Agregando...
                                    </>
                                ) : (
                                    <>
                                        Añadir al Carrito
                                    </>
                                )}
                            </button>
                        </div>
                        
                        {/* Garantías / Info Extra */}
                        <div className="mt-4 d-flex flex-column gap-2 text-muted small">
                            <div className="d-flex align-items-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2 text-success"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                <span>Compra protegida y segura.</span>
                            </div>
                            <div className="d-flex align-items-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2 text-primary"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                                <span>Envíos a todo el país.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
};

export default ProductDetail;

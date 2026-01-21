import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "../../../styles/productList.css";
import carrito from '../../../assets/carrito.gif';
import carritoSolido from '../../../assets/carrito-solido.svg';
import carritoHover from '../../../assets/carrito-hover.svg'

const calcularPrecioConDescuento = (precioOriginal, descuento) => {
  if (!descuento) return precioOriginal;
  return (precioOriginal * (1 - descuento / 100)).toFixed(2);
};

const ProductList = ({ section }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); 
  const prevRef = useRef(null);
  const nextRef = useRef(null);
 const [quantities, setQuantities] = useState({}); 
 const [favorites, setFavorites] = useState([]); 
 
 const [showFlash, setShowFlash] = useState(false);
 const [showNotification, setShowNotification] = useState(false); 
 const [gifActive, setGifActive] = useState({}); 
 const [hoveredProduct, setHoveredProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products");
        const data = await response.json();
        
        setProducts(data);
        const initialQuantities = data.reduce((acc, product) => {
          acc[product._id] = 1;
          return acc;
        }, {});
        setQuantities(initialQuantities);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        try {
          const response = await axios.get(`http://localhost:5000/api/users/favorites/${user.id}`);
          
          const data = Array.isArray(response.data) ? response.data : (response.data.favorites || []);
          const favIds = data.map(item => (typeof item === 'object' && item !== null ? item._id : item));
          setFavorites(favIds);
        } catch (error) {
          console.error("Error fetching favorites:", error);
        }
      }
    };
    fetchFavorites();

    const handleFavoritesUpdate = (e) => {
      if (e.detail) {
        const { productId, action } = e.detail;
        setFavorites((prev) => {
          if (action === 'add' && !prev.includes(productId)) return [...prev, productId];
          if (action === 'remove') return prev.filter((id) => id !== productId);
          return prev;
        });
      } else {
        fetchFavorites();
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, []);

  const handleIncrement = (productId) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [productId]: prevQuantities[productId] + 1,
    }));
  };

  const handleDecrement = (productId) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [productId]: Math.max(1, prevQuantities[productId] - 1), 
    }));
  };

  const handleAddToCart = async (product) => {
    const quantity = quantities[product._id];
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      // Redirigir al login pasando el mensaje en el estado
      navigate('/login', { 
        state: { alert: { type: 'warning', text: 'Para añadir al carrito debe iniciar sesión' } } 
      });
      return;
    }

    // Activar gif
    setGifActive(prev => ({ ...prev, [product._id]: true }));

    const user = JSON.parse(storedUser);
    try {
      await axios.post(`http://localhost:5000/api/users/cart/${user.id}`, {
        productId: product._id,
        quantity: quantity,
      });
      
      // 1. Activar efecto flash
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 500); // Dura lo que la animación CSS

      // 2. Mostrar notificación personalizada
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);

      // 3. Actualizar Header sin recargar
      window.dispatchEvent(new Event('cartUpdated'));
      
    } catch (error) {
      console.error("Error al agregar al carrito:", error);
      alert("Hubo un error al agregar el producto.");
    } finally {
      setTimeout(() => {
        setGifActive(prev => ({ ...prev, [product._id]: false }));
      }, 2500);
    }
  };

  const handleToggleFavorite = async (e, productId) => {
    e.preventDefault(); 
    e.stopPropagation();

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate('/login', { 
        state: { alert: { type: 'warning', text: 'Inicia sesión para gestionar tus favoritos' } } 
      });
      return;
    }

    const user = JSON.parse(storedUser);
    const isFav = favorites.includes(productId);
    const action = isFav ? 'remove' : 'add';

    
    setFavorites((prev) => 
      isFav ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

    
    window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: { productId, action } }));

    try {
      if (isFav) {
        await axios.delete(`http://localhost:5000/api/users/favorites/${user.id}/${productId}`);
      } else {
        await axios.post(`http://localhost:5000/api/users/favorites/${user.id}`, { productId });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    
      setFavorites((prev) => 
        isFav ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
      
      const revertAction = isFav ? 'add' : 'remove';
      window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: { productId, action: revertAction } }));
    }
  };

  const sectionName = section ? section.name : "Lista de Productos";

  const getProductCategories = (product) => {
    if (!product || !product.categoria) return [];
    if (Array.isArray(product.categoria)) {
      return product.categoria
        .map(c => (c && typeof c === 'object') ? (c.nombre || "") : (c || ""))
        .filter(Boolean);
    }
    if (typeof product.categoria === 'object') return [product.categoria.nombre || ""];
    return [String(product.categoria)];
  };

  const normalizeText = (text) => {
    return text
      ? text.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : "";
  };

  const filteredProducts = React.useMemo(() => {
    if (!section || !section.type) return products;

    switch (section.type) {
      case "top-sellers":
        return [...products].sort((a, b) => b.compras - a.compras);
      case "category":
        const categoryToFilter = section.filters?.category?.[0];
        if (!categoryToFilter) return [];
        const normalizedFilter = normalizeText(categoryToFilter);
        return products.filter((product) => getProductCategories(product).some(c => {
          const normalizedProductCat = normalizeText(c);
          return normalizedProductCat.includes(normalizedFilter) || normalizedFilter.includes(normalizedProductCat);
        }));
      case "offers":
        return products.filter((product) => product.precioDescuento);
      case "new":
        return [...products].sort((a, b) => b.tiempo - a.tiempo);
      case "recommended":
        return products;
      case "favorites":
        return products.filter((product) => favorites.includes(product._id));
      default:
        return products;
    }
  }, [products, section, favorites]);

  if (loading) {
    
    if (section._id === 'favorites-page') {
      return <div className="container text-center py-5"><h3>Cargando...</h3></div>;
    }
    return null; 
  }

  if (filteredProducts.length === 0) {
    if (section._id === 'favorites-page') {
      return (
        <div className="container text-center py-5">
          <h3>Todo vacío por acá</h3>
          <p className="text-muted">Agrega productos a tus favoritos para verlos aquí.</p>
          <Link to="/" className="btn btn-primary mt-3">Ir a comprar</Link>
        </div>
      );
    }
    return null;
  }

  // Función auxiliar para renderizar la tarjeta del producto (evita duplicar código)
  const renderProductCard = (product) => (
    <div className="product-item" style={{ width: "100%", maxWidth: "100%" }}>
      <Link to={`/product/${product._id}`} className="product-link">
        <button 
          type="button" 
          className="btn-wishlist"
          onClick={(e) => handleToggleFavorite(e, product._id)}
          style={{ background: favorites.includes(product._id) ? 'rgb(240, 56, 56)' : 'white'}}
        >
          <svg width="24" height="24" style={{ color: favorites.includes(product._id) ? 'white' : 'black'}} >
            <use xlinkHref="/icon.svg#heart"></use>
          </svg>
        </button>
        {product.precioDescuento && (
          <span className="badge badgeB bg-success position-absolute m-3">
            -{product.precioDescuento}%
          </span>
        )}
        <figure>
          <div className="rounded mb-3 image-wrapper">
            <div
              className="image-container"
              style={{
                backgroundImage: `url('${ 
                  product.image || "https://via.placeholder.com/250"
                }')`,
                backgroundSize: "cover",
                height: "200px",
              }}
            ></div>
          </div>
        </figure>
        <h3>{product.nombre || "Producto"}</h3>
        <div className="mb-1">
          {product.precioDescuento && (
            <span className="text-decoration-line-through text-muted me-2">
              ${product.precioOriginal || 0}
            </span>
          )}
          <span className="text-dark fw-bold">
            ${calcularPrecioConDescuento(
              product.precioOriginal,
              product.precioDescuento
            )}
          </span>
        </div>
      </Link>
      <div className="d-flex align-items-center justify-content-between">
        <div className="input-group product-qty">
          <span className="input-group-btn">
            <button
              type="button"
              className="quantity-left-minus btn btn-danger btn-number"
              data-type="minus"
              onClick={() => handleDecrement(product._id)}
            >
              <svg width="16" height="16">
                <use xlinkHref="icon.svg#minus"></use>
              </svg>
            </button>
          </span>
          <input
            type="text"
            id="quantity"
            name="quantity"
            className="form-control input-number"
            value={quantities[product._id]}
            readOnly
          />
          <span className="input-group-btn">
            <button
              type="button"
              className="quantity-right-plus btn btn-success btn-number"
              data-type="plus"
              onClick={() => handleIncrement(product._id)}
            >
              <svg width="16" height="16">
                <use xlinkHref="icon.svg#plus"></use>
              </svg>
            </button>
          </span>
        </div>
        <button
          className="btn border-0 bg-transparent p-0 ms-2"
          onClick={(e) => {
            e.preventDefault();
            handleAddToCart(product);
          }}
          onMouseEnter={() => setHoveredProduct(product._id)}
          onMouseLeave={() => setHoveredProduct(null)}
          style={{ width: '45px', height: '45px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img 
            src={carritoSolido} 
            alt="Agregar" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              position: 'absolute',
              transition: 'all 0.3s ease-in-out',
              opacity: (gifActive[product._id] || hoveredProduct === product._id) ? 0 : 1,
              transform: gifActive[product._id] ? 'scale(0.5)' : 'scale(1)'
            }}
          />
          <img 
            src={carritoHover} 
            alt="Agregar" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              position: 'absolute',
              transition: 'all 0.1s ease-in-out',
              opacity: (!gifActive[product._id] && hoveredProduct === product._id) ? 1 : 0,
              transform: gifActive[product._id] ? 'scale(0.5)' : 'scale(1)'
            }}
          />
          <img 
            src={carrito} 
            alt="Agregando..." 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              position: 'absolute',
              transition: 'all 0.3s ease-in-out',
              opacity: gifActive[product._id] ? 1 : 0,
              transform: gifActive[product._id] ? 'scale(1)' : 'scale(0.5)'
            }}
          />
        </button>
      </div>
    </div>
  );

  // VISTA DE CARRUSEL (SWIPER) PARA EL RESTO DE SECCIONES
  return (
    <section className="overflow-hidden product-carousel">
      
      {/* Efecto Flash en toda la pantalla */}
      {showFlash && <div className="flash-success"></div>}

      {/* Notificación Flotante */}
      {showNotification && (
        <div className="cart-notification">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Producto agregado correctamente
        </div>
      )}

      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            {/* Encabezado con flechas de navegación */}
            <div className="section-header d-flex flex-wrap justify-content-between ">
              <h2 className="section-title p-3">{sectionName}</h2>
              <div className="d-flex align-items-center">
                {section.type !== 'favorites' && (
                  <Link to="/catalogo" href="#" className="btn-link text-decoration-none me-3">
                    Mirar todas las Categorías →
                  </Link>
                )}
                <div className="swiper-buttons">
                  <button
                    ref={prevRef}
                    className="swiper-prev btn btn-primary m-2"
                  >
                    ❮
                  </button>
                  <button
                    ref={nextRef}
                    className="swiper-next btn btn-primary m-2 "
                  >
                    ❯
                  </button>
                </div>
              </div>
            </div>

            {/* Carrusel de productos */}
            <Swiper
              modules={[Navigation]}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              onInit={(swiper) => {
                setTimeout(() => {
                  swiper.params.navigation.prevEl = prevRef.current;
                  swiper.params.navigation.nextEl = nextRef.current;
                  swiper.navigation.init();
                  swiper.navigation.update();
                });
              }}
              spaceBetween={25} // Aumentado para separar más las tarjetas
              slidesPerView={5} // Cantidad inicial de tarjetas visibles
              breakpoints={{
                320: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                900: { slidesPerView: 3 },
                1200: { slidesPerView: 4 }, // Ajusta a 4 tarjetas entre 1200px y 1465px
                1465: { slidesPerView: 5 }, // Regresa a 5 tarjetas después de 1465px
              }}
            >

              {filteredProducts.map((product) => (
                <SwiperSlide key={product._id}>
                  {renderProductCard(product)}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductList;

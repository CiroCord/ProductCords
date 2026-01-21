import React, { useState, useEffect } from "react";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import axios from "axios";
import OffcanvasCart from "./OffcanvasCart";
import OffcanvasSearch from "./OffcanvasSearch";
import { Link } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const Header = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserOverlayVisible, setIsUserOverlayVisible] = useState(false);
  const [isOverlayPinned, setIsOverlayPinned] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [categories, setCategories] = useState([]);

  const logo = "/Logo.svg";

  // Definimos fetchUser fuera del useEffect para poder pasarlo como prop
  const fetchUser = async () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser && parsedUser.id) {
        try {
          // Al llamar a esta ruta, el backend ahora hace populate del carrito
          const response = await fetch(`${BACKEND_URL}/api/users/${parsedUser.id}`);
          if (response.ok) {
            const data = await response.json();
            setUser(data);
          }
        } catch (error) {
          console.error("Error al conectar con el servidor:", error);
        }
      }
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products for search:", error);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchProducts();
    
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/products`); // O api/configuration si prefieres la lista centralizada
        // Si usas api/configuration como en los otros componentes:
        const configRes = await axios.get(`${BACKEND_URL}/api/configuration`);
        if (configRes.data && configRes.data.categorias) {
           setCategories(configRes.data.categorias);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();

    // Escuchar evento personalizado para actualizar el carrito sin recargar
    window.addEventListener('cartUpdated', fetchUser);

    // Limpiar el evento al desmontar
    return () => {
      window.removeEventListener('cartUpdated', fetchUser);
    };
  }, []);

  const toggleOverlay = () => {
    if (isOverlayPinned) {
      setIsOverlayPinned(false);
    } else {
      setIsUserOverlayVisible(!isUserOverlayVisible);
    }
  };

  const pinOverlay = () => {
    setIsOverlayPinned(true);
  };

  const closeOverlay = () => {
    setIsOverlayPinned(false);
    setIsUserOverlayVisible(false);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsOverlayPinned(false);
    setIsUserOverlayVisible(false);
  };

  // Función auxiliar para normalizar texto (quitar acentos y pasar a minúsculas)
  const normalizeText = (text) => {
    return text
      ? text.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : "";
  };

  // Función auxiliar para obtener el nombre de la categoría de forma segura (Igual que en OffcanvasSearch)
  const getCategoryName = (product) => {
    if (!product || !product.categoria) return "";
    if (Array.isArray(product.categoria)) {
      return product.categoria
        .map(c => (c && typeof c === 'object') ? (c.nombre || "") : (c || ""))
        .filter(Boolean)
        .join(" ");
    }
    if (typeof product.categoria === 'object') {
      return product.categoria.nombre || "";
    }
    return String(product.categoria);
  };

  // Algoritmo de búsqueda mejorado
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (!term || term.trim() === "") {
      setSearchResults([]);
      return;
    }

    const normalizedTerm = normalizeText(term);

    const filtered = products.filter((product) => {
      const productName = normalizeText(product.nombre);
      const productCategory = normalizeText(getCategoryName(product));

      return productName.includes(normalizedTerm) || productCategory.includes(normalizedTerm) || (productCategory.length > 0 && normalizedTerm.includes(productCategory));
    });

    setSearchResults(filtered);
  };

  return (
    <header>
      <div className="container-fluid">
        <div className="row py-3 border-bottom align-items-center">
          <div className="col-6 col-sm-4 col-lg-3 text-start">
            <div className="main-logo">
              <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
                <img src={logo} alt="logo" className="img-fluid" style={{ maxHeight: '40px' }} />
                <span className="fw-bold text-dark fs-4 d-none d-sm-block">Product<span className="text-primary">Cords</span></span>
              </Link>
            </div>
          </div>

          <div className="col-lg-6 d-none d-lg-block">
            <div className="search-bar row bg-light p-2 my-2 rounded-4 position-relative">
              <div className="col-md-4 d-none d-md-block">
                <select 
                  className="form-select border-0 bg-transparent"
                  onChange={(e) => handleSearch({ target: { value: e.target.value } })}
                >
                  <option value="">Todas</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.nombre}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-11 col-md-7 ">
                <form id="search-form" className="text-center" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="text"
                    className="form-control border-0 bg-transparent"
                    placeholder="Busca entre todo nuestro catalogo"
                    aria-label="Busca entre todo nuestro catalogo"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </form>
              </div>
              <div className="col-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M21.71 20.29L18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.39ZM11 18a7 7 0 1 1 7-7a7 7 0 0 1-7 7Z"
                  />
                </svg>
              </div>
              
              {/* Resultados de búsqueda desplegables */}
              {searchResults.length > 0 && (
                <div className="position-absolute start-0 end-0 bg-white shadow rounded-bottom p-2" style={{ top: "100%", zIndex: 1000, maxHeight: "300px", overflowY: "auto" }}>
                  <ul className="list-group list-group-flush text-start">
                    {searchResults.map((product) => (
                      <li key={product._id} className="list-group-item list-group-item-action">
                        <Link to={`/product/${product._id}`} className="text-decoration-none text-dark d-flex align-items-center gap-2" onClick={() => { setSearchResults([]); setSearchTerm(""); }}>
                          {product.imagen && <img src={product.imagen} alt={product.nombre} style={{ width: "40px", height: "40px", objectFit: "cover" }} />}
                          <div>
                            <div className="fw-bold">{product.nombre}</div>
                            <small className="text-muted">{getCategoryName(product)} - ${product.precioOriginal}</small>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="col-6 col-sm-8 col-lg-3 d-flex justify-content-end gap-2 align-items-center">
            

            <ul className="d-flex justify-content-end list-unstyled m-0 position-relative">
              
              <li className="position-relative" onMouseLeave={closeOverlay}>
                {user ? (
                  // Si el usuario está autenticado
                  <>
                  
                    <button
                      className="rounded-circle bg-light p-2 mx-1 border-0"
                      onClick={toggleOverlay}
                    >
                      
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <use xlinkHref="/icon.svg#user"></use>
                      </svg>
                    </button>

                    <div
                      className={`user-overlay ${
                        isUserOverlayVisible ? "show" : "hide"
                      } ${isOverlayPinned ? "pinned" : ""}`}
                    >
                      <p className="m-0 fw-bold">{user.username}</p>
                      <p className="text-muted small">{user.email}</p>
                      <div className="d-flex flex-column gap-2 mt-3">
                        {user.isAdmin && (
                          <Link to="/admin" className="btn btn-warning btn-sm fw-bold">
                            Dashboard
                          </Link>
                        )}
                        {user.hasOrders && (
                          <Link to="/my-orders" className="btn btn-info btn-sm text-white">Mis Pedidos</Link>
                        )}
                        <Link to="/edit-profile" className="btn btn-primary btn-sm">Editar Perfil</Link>
                        <button className="btn btn-danger btn-sm" onClick={logout}>
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // Si no hay usuario autenticado
                  <>
                    <div className="user-logout d-none d-1500-flex align-items-center">
                      <Link to="/login" state={{ isSignUp: false }}><button className="btn btn-primary btn-sm mx-1 text-nowrap">Iniciar Sesión</button></Link>
                      <Link to="/login" state={{ isSignUp: true }}><button className="btn btn-secondary btn-sm mx-1 text-nowrap">Registrarse</button></Link>
                    </div>

                    {/* Icono + Menú desplegable para pantallas más pequeñas (Laptop, Tablet, Mobile) */}
                    <div className="d-1500-none">
                      <button className="rounded-circle bg-light p-2 mx-1 border-0" onClick={toggleOverlay}>
                        <svg width="24" height="24" viewBox="0 0 24 24"><use xlinkHref="/icon.svg#user"></use></svg>
                      </button>
                      <div className={`user-overlay ${isUserOverlayVisible ? "show" : "hide"} ${isOverlayPinned ? "pinned" : ""}`}>
                        <p className="m-0 fw-bold mb-3 text-center">Bienvenido</p>
                        <div className="d-flex flex-column gap-2">
                          <Link to="/login" state={{ isSignUp: false }} className="btn btn-primary btn-sm" onClick={closeOverlay}>Iniciar Sesión</Link>
                          <Link to="/login" state={{ isSignUp: true }} className="btn btn-outline-secondary btn-sm" onClick={closeOverlay}>Registrarse</Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </li>
              <li>
                <Link to="/favorites" href="#" className="rounded-circle bg-light p-2 mx-1">
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <use xlinkHref="/icon.svg#heart"></use>
                  </svg>
                </Link>
              </li>
              <li className="d-lg-none">
                <a
                  href="#"
                  className="rounded-circle bg-light p-2 mx-1"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#offcanvasCart"
                  aria-controls="offcanvasCart"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <use xlinkHref="/icon.svg#cart"></use>
                  </svg>
                </a>
              </li>
              <OffcanvasSearch />
            </ul>

            <OffcanvasCart user={user} refreshCart={fetchUser} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

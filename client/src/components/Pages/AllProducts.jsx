import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/style.css';
import '../../styles/productList.css';

const calcularPrecioConDescuento = (precioOriginal, descuento) => {
    if (!descuento) return precioOriginal;
    return (precioOriginal * (1 - descuento / 100)).toFixed(2);
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const AllProducts = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [quantities, setQuantities] = useState({});
    
    // --- ESTADOS DE LOS FILTROS ---
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
    const [weightFilter, setWeightFilter] = useState({ min: '', max: '' });

    // --- ESTADOS DE USUARIO (Favoritos/Carrito) ---
    const [favorites, setFavorites] = useState([]);

    // Efecto para leer parámetros de URL (ej: click desde Home > Categorías)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');
        if (categoryParam) {
            setSelectedCategories([categoryParam]);
        }
    }, [location.search]);

    // 1. Cargar Productos y Categorías al inicio
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    axios.get(`${BACKEND_URL}/api/products`),
                    axios.get(`${BACKEND_URL}/api/configuration`)
                ]);

                setProducts(prodRes.data);
                setFilteredProducts(prodRes.data);

                const initialQuantities = prodRes.data.reduce((acc, product) => {
                    acc[product._id] = 1;
                    return acc;
                }, {});
                setQuantities(initialQuantities);

                if (catRes.data && catRes.data.categorias) {
                    setCategories(catRes.data.categorias);
                }
            } catch (err) {
                console.error("Error cargando datos:", err);
            }
        };
        fetchData();
        
        // Cargar favoritos si hay usuario logueado
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            axios.get(`${BACKEND_URL}/api/users/favorites/${user.id}`)
                .then(res => {
                    const data = Array.isArray(res.data) ? res.data : (res.data.favorites || []);
                    setFavorites(data.map(item => (item._id || item)));
                })
                .catch(err => console.error(err));
        }
    }, []);

    // --- HELPERS ---
    const normalizeText = (text) => {
        return text
            ? text.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
            : "";
    };

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

    const getPrice = (p) => p.precioDescuento 
        ? (p.precioOriginal * (1 - p.precioDescuento / 100)) 
        : p.precioOriginal;

    // 2. Lógica de Filtrado (Se ejecuta cuando cambia cualquier filtro)
    useEffect(() => {
        let result = products;

        // Filtro por Buscador (Nombre o Categoría)
        if (searchTerm.trim()) {
            const term = normalizeText(searchTerm);
            result = result.filter(p => 
                normalizeText(p.nombre).includes(term) || 
                getProductCategories(p).some(c => normalizeText(c).includes(term))
            );
        }

        // Filtro por Categorías (Checkboxes)
        if (selectedCategories.length > 0) {
            const selectedNormalized = selectedCategories.map(c => normalizeText(c));
            result = result.filter(p => {
                const productCats = getProductCategories(p).map(c => normalizeText(c));
                return productCats.some(pCat => 
                    selectedNormalized.some(selCat => pCat === selCat || pCat.includes(selCat) || selCat.includes(pCat))
                );
            });
        }

        // Filtro por Precio
        if (priceFilter.min) result = result.filter(p => getPrice(p) >= Number(priceFilter.min));
        if (priceFilter.max) result = result.filter(p => getPrice(p) <= Number(priceFilter.max));

        // Filtro por Peso
        if (weightFilter.min) result = result.filter(p => (p.peso || 0) >= Number(weightFilter.min));
        if (weightFilter.max) result = result.filter(p => (p.peso || 0) <= Number(weightFilter.max));

        setFilteredProducts(result);
    }, [products, searchTerm, selectedCategories, priceFilter, weightFilter]);

    const handleIncrement = (productId) => {
        setQuantities((prev) => ({ ...prev, [productId]: (prev[productId] || 1) + 1 }));
    };

    const handleDecrement = (productId) => {
        setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, (prev[productId] || 1) - 1) }));
    };

    // --- HANDLERS ---
    const handleAddToCart = async (product) => {
        const quantity = quantities[product._id] || 1;
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return navigate('/login');
        
        const user = JSON.parse(storedUser);
        try {
            await axios.post(`${BACKEND_URL}/api/users/cart/${user.id}`, {
                productId: product._id,
                quantity: quantity,
            });
            window.dispatchEvent(new Event('cartUpdated'));
            alert("Producto agregado al carrito");
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleFavorite = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        const storedUser = localStorage.getItem("user");
        if (!storedUser) return navigate('/login');
        
        const user = JSON.parse(storedUser);
        const isFav = favorites.includes(product._id);
        
        setFavorites(prev => isFav ? prev.filter(id => id !== product._id) : [...prev, product._id]);

        try {
            if (isFav) await axios.delete(`${BACKEND_URL}/api/users/favorites/${user.id}/${product._id}`);
            else await axios.post(`${BACKEND_URL}/api/users/favorites/${user.id}`, { productId: product._id });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container-fluid py-5" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            <div className="row">
                {/* --- SIDEBAR DE FILTROS (IZQUIERDA) --- */}
                <div className="col-lg-3 mb-4">
                    <div className="bg-white p-4 rounded shadow-sm sticky-top" style={{ top: "20px", zIndex: 1 }}>
                        <h4 className="mb-4 fw-bold">Filtros</h4>
                        
                        {/* 1. Buscador */}
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-uppercase text-muted">Búsqueda</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Buscar producto..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* 2. Categorías */}
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-uppercase text-muted">Categorías</label>
                            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                                {categories.map(cat => (
                                    <div key={cat} className="form-check">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            id={`filter-cat-${cat.nombre}`}
                                            checked={selectedCategories.includes(cat.nombre)}
                                            onChange={() => {
                                                setSelectedCategories(prev => 
                                                    prev.includes(cat.nombre) ? prev.filter(c => c !== cat.nombre) : [...prev, cat.nombre]
                                                );
                                            }}
                                        />
                                        <label className="form-check-label" htmlFor={`filter-cat-${cat.nombre}`}>
                                            {cat.nombre}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Precio */}
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-uppercase text-muted">Precio ($)</label>
                            <div className="input-group mb-2">
                                <input type="number" className="form-control" placeholder="Mín" value={priceFilter.min} onChange={e => setPriceFilter({...priceFilter, min: e.target.value})} />
                                <span className="input-group-text">-</span>
                                <input type="number" className="form-control" placeholder="Máx" value={priceFilter.max} onChange={e => setPriceFilter({...priceFilter, max: e.target.value})} />
                            </div>
                        </div>

                        {/* 4. Peso */}
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-uppercase text-muted">Peso (g)</label>
                            <div className="input-group">
                                <input type="number" className="form-control" placeholder="Mín" value={weightFilter.min} onChange={e => setWeightFilter({...weightFilter, min: e.target.value})} />
                                <span className="input-group-text">-</span>
                                <input type="number" className="form-control" placeholder="Máx" value={weightFilter.max} onChange={e => setWeightFilter({...weightFilter, max: e.target.value})} />
                            </div>
                        </div>

                        <button className="btn btn-outline-dark w-100 mt-2" onClick={() => {
                            setSearchTerm(""); setSelectedCategories([]); setPriceFilter({min: '', max: ''}); setWeightFilter({min: '', max: ''});
                        }}>
                            Limpiar Filtros
                        </button>
                    </div>
                </div>

                {/* --- GRILLA DE PRODUCTOS (DERECHA) --- */}
                <div className="col-lg-9">
                    <div className="row g-4">
                        {filteredProducts.map(product => (
                            <div key={product._id} className="col-xl-4 col-md-6">
                                <div className="product-item" style={{ width: "100%", maxWidth: "100%" }}>
                                    <Link to={`/product/${product._id}`} className="product-link">
                                        <button 
                                            type="button" 
                                            className="btn-wishlist"
                                            onClick={(e) => handleToggleFavorite(e, product)}
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
                                                <div className="image-container" style={{ backgroundImage: `url('${product.image || "https://via.placeholder.com/250"}')`, backgroundSize: "cover", height: "200px" }}></div>
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
                                                ${calcularPrecioConDescuento(product.precioOriginal, product.precioDescuento)}
                                            </span>
                                        </div>
                                    </Link>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="input-group product-qty">
                                            <span className="input-group-btn">
                                                <button type="button" className="quantity-left-minus btn btn-danger btn-number" onClick={() => handleDecrement(product._id)}>
                                                    <svg width="16" height="16"><use xlinkHref="icon.svg#minus"></use></svg>
                                                </button>
                                            </span>
                                            <input type="text" className="form-control input-number" value={quantities[product._id] || 1} readOnly />
                                            <span className="input-group-btn">
                                                <button type="button" className="quantity-right-plus btn btn-success btn-number" onClick={() => handleIncrement(product._id)}>
                                                    <svg width="16" height="16"><use xlinkHref="icon.svg#plus"></use></svg>
                                                </button>
                                            </span>
                                        </div>
                                        <button className="nav-link" onClick={() => handleAddToCart(product)}>Add to Cart</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && <div className="col-12 text-center py-5"><h3 className="text-muted">No se encontraron productos.</h3></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllProducts;
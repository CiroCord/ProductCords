import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductForm from "../inicio/productos/IngresarProducto";
import '../../../styles/style.css';
import { useUser } from "../user/UserContext";


const ManageProducts = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    
    // Estados de Vista (Lista vs Formulario)
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Estados de Filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
    const [weightFilter, setWeightFilter] = useState({ min: '', max: '' });
    const { isSpectator, loading: userLoading } = useUser() || { isSpectator: true, loading: true };

    // Cargar datos
    const fetchData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                axios.get("http://localhost:5000/api/products"),
                axios.get("http://localhost:5000/api/configuration")
            ]);
            setProducts(prodRes.data);
            setFilteredProducts(prodRes.data);
            if (catRes.data && catRes.data.categorias) {
                setCategories(catRes.data.categorias);
            }
        } catch (err) {
            console.error("Error cargando datos:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- HELPERS (Misma lógica que AllProducts) ---
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

    // --- LÓGICA DE FILTRADO ---
    useEffect(() => {
        let result = products;

        if (searchTerm.trim()) {
            const term = normalizeText(searchTerm);
            result = result.filter(p => 
                normalizeText(p.nombre).includes(term) || 
                getProductCategories(p).some(c => normalizeText(c).includes(term))
            );
        }

        if (selectedCategories.length > 0) {
            const selectedNormalized = selectedCategories.map(c => normalizeText(c));
            result = result.filter(p => {
                const productCats = getProductCategories(p).map(c => normalizeText(c));
                return productCats.some(pCat => 
                    selectedNormalized.some(selCat => pCat === selCat || pCat.includes(selCat) || selCat.includes(pCat))
                );
            });
        }

        if (priceFilter.min) result = result.filter(p => getPrice(p) >= Number(priceFilter.min));
        if (priceFilter.max) result = result.filter(p => getPrice(p) <= Number(priceFilter.max));
        if (weightFilter.min) result = result.filter(p => (p.peso || 0) >= Number(weightFilter.min));
        if (weightFilter.max) result = result.filter(p => (p.peso || 0) <= Number(weightFilter.max));

        setFilteredProducts(result);
    }, [products, searchTerm, selectedCategories, priceFilter, weightFilter]);

    // --- ACCIONES ---
    const handleDelete = async (id) => {
        // Verificación de Modo Espectador
        if (userLoading) {
            alert("Cargando permisos... Por favor espera un momento.");
            return;
        }
        if (isSpectator) {
            alert("Estás en modo espectador. Los cambios no se guardarán por una cuestión de seguridad. El administrador de la página tiene permiso para hacer estos cambios.");
            return;
        }

        if (!window.confirm("¿Estás seguro de que deseas eliminar este producto permanentemente?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/products/${id}`);
            fetchData(); // Recargar lista
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Hubo un error al eliminar el producto.");
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingProduct(null);
        fetchData(); // Recargar lista para ver cambios
    };

    // --- RENDER ---
    if (showForm) {
        return (
            <div className="container-fluid p-4">
                <button className="btn btn-outline-secondary mb-3" onClick={() => setShowForm(false)}>
                    ← Volver a la lista
                </button>
                <h3 className="mb-3">{editingProduct ? `Editar: ${editingProduct.nombre}` : 'Agregar Nuevo Producto'}</h3>
                {/* Pasamos props al formulario. Si ProductForm no las soporta aún, se mostrará el form vacío por defecto */}
                <ProductForm key={editingProduct ? editingProduct._id : 'new'} existingProduct={editingProduct} onSuccess={handleFormSuccess} />
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Administrar Productos</h3>
                <button className="btn btn-success" onClick={handleCreate}>
                    + Nuevo Producto
                </button>
            </div>

            <div className="row">
                {/* Sidebar Filtros */}
                <div className="col-lg-3 mb-4">
                    <div className="bg-white p-3 rounded shadow-sm sticky-top" style={{ top: "20px" }}>
                        <h5 className="mb-3 fw-bold">Filtros</h5>
                        <div className="mb-3">
                            <input type="text" className="form-control" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="mb-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                            <label className="form-label small text-muted">Categorías</label>
                            {categories.map(cat => (
                                <div key={cat._id} className="form-check">
                                    <input className="form-check-input" type="checkbox" id={`adm-cat-${cat._id}`} 
                                        checked={selectedCategories.includes(cat.nombre)}
                                        onChange={() => setSelectedCategories(prev => prev.includes(cat.nombre) ? prev.filter(c => c !== cat.nombre) : [...prev, cat.nombre])}
                                    />
                                    <label className="form-check-label small" htmlFor={`adm-cat-${cat._id}`}>{cat.nombre}</label>
                                </div>
                            ))}
                        </div>
                        <div className="mb-3">
                            <label className="form-label small text-muted">Precio</label>
                            <div className="input-group input-group-sm">
                                <input type="number" className="form-control" placeholder="Min" value={priceFilter.min} onChange={e => setPriceFilter({...priceFilter, min: e.target.value})} />
                                <input type="number" className="form-control" placeholder="Max" value={priceFilter.max} onChange={e => setPriceFilter({...priceFilter, max: e.target.value})} />
                            </div>
                        </div>
                        <button className="btn btn-outline-dark btn-sm w-100" onClick={() => {
                            setSearchTerm(""); setSelectedCategories([]); setPriceFilter({min:'',max:''}); setWeightFilter({min:'',max:''});
                        }}>Limpiar Filtros</button>
                    </div>
                </div>

                {/* Lista de Productos */}
                <div className="col-lg-9">
                    <div className="row g-3">
                        {filteredProducts.map(p => (
                            <div key={p._id} className="col-xl-4 col-md-6">
                                <div className="card h-100 shadow-sm border-0">
                                    <div className="row g-0 h-100">
                                        <div className="col-4">
                                            <div style={{
                                                width: '100%', height: '100%',
                                                backgroundImage: `url(${p.image || 'https://via.placeholder.com/150'})`,
                                                backgroundSize: 'cover', backgroundPosition: 'center',
                                                minHeight: '130px', borderTopLeftRadius: '0.375rem', borderBottomLeftRadius: '0.375rem'
                                            }}></div>
                                        </div>
                                        <div className="col-8">
                                            <div className="card-body p-2 d-flex flex-column h-100">
                                                <h6 className="card-title mb-1 text-truncate" title={p.nombre}>{p.nombre}</h6>
                                                <small className="text-muted mb-2 d-block text-truncate">{getProductCategories(p).join(', ')}</small>
                                                <div className="mt-auto">
                                                    <div className="fw-bold mb-2">${p.precioOriginal}</div>
                                                    <div className="d-flex gap-1">
                                                        <button className="btn btn-sm btn-outline-primary flex-grow-1" onClick={() => handleEdit(p)}>Editar</button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p._id)}>Eliminar</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && <div className="col-12 text-center py-5 text-muted">No se encontraron productos.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageProducts; 
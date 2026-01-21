import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from "../user/UserContext";

// Lista de íconos SVG disponibles para seleccionar
const AVAILABLE_ICONS = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>', // Cubiertos
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>', // Bebida
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>', // Manzana
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7z"/><path d="M8.64 14l-2.05-2.04M15.34 15l-2.46-2.46"/><path d="M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9z"/><path d="M15 2s-2 1.33-2 3.5c0 1.64 2 3.5 2 3.5s2-1.33 2-3.5C17 3.33 15 2 15 2z"/></svg>', // Zanahoria
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shirt-icon lucide-shirt"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',//ROPA
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pizza-icon lucide-pizza"><path d="m12 14-1 1"/><path d="m13.75 18.25-1.25 1.42"/><path d="M17.775 5.654a15.68 15.68 0 0 0-12.121 12.12"/><path d="M18.8 9.3a1 1 0 0 0 2.1 7.7"/><path d="M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z"/></svg>',//Pizza
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-popsicle-icon lucide-popsicle"><path d="M18.6 14.4c.8-.8.8-2 0-2.8l-8.1-8.1a4.95 4.95 0 1 0-7.1 7.1l8.1 8.1c.9.7 2.1.7 2.9-.1Z"/><path d="m22 22-5.5-5.5"/></svg>',//ICE CREAM
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-vegan-icon lucide-vegan"><path d="M16 8q6 0 6-6-6 0-6 6"/><path d="M17.41 3.59a10 10 0 1 0 3 3"/><path d="M2 2a26.6 26.6 0 0 1 10 20c.9-6.82 1.5-9.5 4-14"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-drumstick-icon lucide-drumstick"><path d="M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23"/><path d="m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59"/></svg>',//pollo
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-handbag-icon lucide-handbag"><path d="M2.048 18.566A2 2 0 0 0 4 21h16a2 2 0 0 0 1.952-2.434l-2-9A2 2 0 0 0 18 8H6a2 2 0 0 0-1.952 1.566z"/><path d="M8 11V6a4 4 0 0 1 8 0v5"/></svg>',//bolsa
    ];

const ManageCategories = () => {
    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState("");
    const [selectedIcon, setSelectedIcon] = useState(""); // Estado para el ícono seleccionado
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para edición
    const [editingCategory, setEditingCategory] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [editIcon, setEditIcon] = useState("");

    // Estados para el Buscador de Íconos (API)
    const [showIconModal, setShowIconModal] = useState(false);
    const [iconSearchTerm, setIconSearchTerm] = useState("");
    const [iconResults, setIconResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [iconTarget, setIconTarget] = useState(null); // 'new' o 'edit'
    const { isSpectator, loading: userLoading } = useUser() || { isSpectator: true, loading: true };

    // Cargar categorías desde el backend al montar
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/configuration");
                if (res.data && res.data.categorias) {
                    setCategories(res.data.categorias);
                }
            } catch (err) {
                // Si da 404 es que no existe config aún, lo tratamos como vacío sin error visual
                if (err.response && err.response.status === 404) {
                    setCategories([]);
                } else {
                    console.error("Error al cargar categorías:", err);
                }
            }
        };
        fetchCategories();
    }, []);

    const handleAdd = async () => {
        // Verificación de Modo Espectador
        if (userLoading) {
            alert("Cargando permisos... Por favor espera un momento.");
            return;
        }
        if (isSpectator) {
            alert("Estás en modo espectador. Los cambios no se guardarán por una cuestión de seguridad. El administrador de la página tiene permiso para hacer estos cambios.");
            return;
        }

        if (!newCat.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post("http://localhost:5000/api/configuration/category", { nombre: newCat.trim(), icono: selectedIcon });
            setCategories(res.data.categorias);
            setNewCat("");
            setSelectedIcon("");
        } catch (err) {
            console.error("Error al agregar categoría:", err);
            setError(err.response?.data?.message || "Error al agregar categoría");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (cat) => {
        // Verificación de Modo Espectador
        if (userLoading) {
            alert("Cargando permisos... Por favor espera un momento.");
            return;
        }
        if (isSpectator) {
            alert("Estás en modo espectador. Los cambios no se guardarán por una cuestión de seguridad. El administrador de la página tiene permiso para hacer estos cambios.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de eliminar la categoría "${cat.nombre}"?`)) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.delete("http://localhost:5000/api/configuration/category", {
                data: { nombre: cat.nombre }
            });
            setCategories(res.data.categorias);
        } catch (err) {
            console.error("Error al eliminar categoría:", err);
            setError(err.response?.data?.message || "Error al eliminar categoría");
        } finally {
            setLoading(false);
        }
    };

    // Funciones para Editar
    const handleStartEdit = (cat) => {
        setEditingCategory(cat);
        setEditValue(cat.nombre);
        setEditIcon(cat.icono);
    };

    const handleSaveEdit = async () => {
        // Verificación de Modo Espectador
        if (userLoading) {
            alert("Cargando permisos... Por favor espera un momento.");
            return;
        }
        if (isSpectator) {
            alert("Estás en modo espectador. Los cambios no se guardarán por una cuestión de seguridad. El administrador de la página tiene permiso para hacer estos cambios.");
            return;
        }

        if (!editValue.trim()) {
            setEditingCategory(null);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Creamos el nuevo array con el nombre e ícono actualizados
            const updatedCategories = categories.map(c => c._id === editingCategory._id ? { ...c, nombre: editValue.trim(), icono: editIcon } : c);
            
            // Usamos el endpoint PUT que actualiza toda la lista
            const res = await axios.put("http://localhost:5000/api/configuration", { categorias: updatedCategories });
            
            setCategories(res.data.categorias);
            setEditingCategory(null);
            setEditValue("");
            setEditIcon("");
        } catch (err) {
            console.error("Error al editar categoría:", err);
            setError(err.response?.data?.message || "Error al editar categoría");
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DEL BUSCADOR DE ÍCONOS ---
    const openIconModal = (target) => {
        setIconTarget(target);
        setShowIconModal(true);
        if (iconResults.length === 0) {
            setIconSearchTerm("food"); // Búsqueda por defecto
        }
    };

    const handleSearchIcons = async (e) => {
        e?.preventDefault();
        if (!iconSearchTerm.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://api.iconify.design/search?query=${iconSearchTerm}&limit=60`);
            const data = await res.json();
            if (data.icons) setIconResults(data.icons);
        } catch (err) {
            console.error("Error buscando íconos:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectFromApi = async (iconName) => {
        try {
            const res = await fetch(`https://api.iconify.design/${iconName}.svg?width=24&height=24`);
            const svg = await res.text();
            if (iconTarget === 'new') setSelectedIcon(svg);
            else setEditIcon(svg);
            setShowIconModal(false);
        } catch (err) {
            console.error("Error obteniendo SVG:", err);
        }
    };

    return (
        <div className="container p-4">
            <h3>Gestión de Categorías</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row mt-4 align-items-stretch">
                <div className="col-md-7 mb-4">
                    <div className="card p-3 shadow-sm h-100">
                        <h6 className="mb-3">Agregar Nueva Categoría</h6>
                        <div className="mb-3">
                            <label className="form-label small text-muted">Nombre</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Ej: Bebidas" 
                                value={newCat}
                                onChange={(e) => setNewCat(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small text-muted">Selecciona un Ícono</label>
                            <div className="d-flex flex-wrap gap-2">
                                {AVAILABLE_ICONS.map((icon, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setSelectedIcon(icon)}
                                        className={`border rounded d-flex align-items-center justify-content-center ${selectedIcon === icon ? 'bg-primary text-white border-primary' : 'bg-light text-dark'}`}
                                        style={{ width: '40px', height: '40px', cursor: 'pointer', transition: 'all 0.2s' }}
                                        dangerouslySetInnerHTML={{ __html: icon }}
                                    />
                                ))}
                                <button 
                                    className="btn btn-outline-primary d-flex align-items-center justify-content-center" 
                                    style={{width:'40px', height:'40px'}} 
                                    onClick={() => openIconModal('new')} 
                                    title="Buscar más íconos en la web"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </button>
                            </div>
                        </div>
                        <button className="btn btn-primary w-100" onClick={handleAdd} disabled={loading || !newCat.trim()}>
                            {loading ? 'Guardando...' : 'Agregar Categoría'}
                        </button>
                    </div>
                </div>
                <div className="col-md-5 mb-4 position-relative">
                    <div className="card p-3 shadow-sm category-card-fixed">
                        <h5 className="mb-3">Listado de Categorías</h5>
                        <div className="category-list-scroll">
                            <ul className="list-group">
                        {categories.map(cat => (
                            <li key={cat._id || cat.nombre} className="list-group-item d-flex justify-content-between align-items-center">
                                {editingCategory && editingCategory._id === cat._id ? (
                                    <div className="w-100">
                                        <div className="d-flex gap-2 mb-2">
                                            <input 
                                                type="text" 
                                                className="form-control form-control-sm" 
                                                value={editValue} 
                                                onChange={(e) => setEditValue(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            {/* Icono seleccionado actualmente */}
                                            <div 
                                                className="border rounded d-flex align-items-center justify-content-center bg-light text-primary"
                                                style={{ width: '40px', height: '40px' }}
                                                dangerouslySetInnerHTML={{ __html: editIcon || '<span class="small text-muted">?</span>' }}
                                            />
                                            {/* Botón de búsqueda */}
                                            <button 
                                                className="btn btn-outline-primary d-flex align-items-center justify-content-center" 
                                                style={{width:'40px', height:'40px'}} 
                                                onClick={() => openIconModal('edit')}
                                                title="Buscar más..."
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                            </button>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                            {AVAILABLE_ICONS.map((icon, idx) => (
                                                <div 
                                                    key={idx}
                                                    onClick={() => setEditIcon(icon)}
                                                    className={`border rounded d-flex align-items-center justify-content-center ${editIcon === icon ? 'bg-primary text-white border-primary' : 'bg-light text-dark'}`}
                                                    style={{ width: '32px', height: '32px', cursor: 'pointer' }}
                                                    dangerouslySetInnerHTML={{ __html: icon }}
                                                />
                                            ))}
                                        </div>
                                        <div className="d-flex gap-2 justify-content-end">
                                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingCategory(null)} disabled={loading}>
                                                Cancelar
                                            </button>
                                            <button className="btn btn-sm btn-success" onClick={handleSaveEdit} disabled={loading}>
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="d-flex align-items-center gap-3">
                                            {cat.icono ? (
                                                <div 
                                                    className="text-primary"
                                                    style={{ width: '24px', height: '24px', marginBottom:'10 px' }}
                                                    dangerouslySetInnerHTML={{ __html: cat.icono }}
                                                />
                                            ) : (
                                                <div className="bg-light rounded-circle" style={{width:'24px', height:'24px'}}></div>
                                            )}
                                            <span className="fw-bold">{cat.nombre}</span>
                                        </div>
                                        <div>
                                            <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleStartEdit(cat)} disabled={loading}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(cat)} disabled={loading}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                        {categories.length === 0 && <li className="list-group-item text-muted">No hay categorías definidas.</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    <div className="alert alert-info">
                        <p><strong>Nota:</strong> Las categorías se utilizan para filtrar productos y organizar secciones.</p>
                        <p>Asegúrate de que los productos tengan asignada una de estas categorías.</p>
                        <p>Los cambios se guardan automáticamente en la configuración global.</p>
                    </div>
                </div>
            </div>

            {/* MODAL DE BÚSQUEDA DE ÍCONOS */}
            {showIconModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
                    <div className="bg-white rounded shadow-lg p-4 d-flex flex-column" style={{width: '90%', maxWidth: '600px', maxHeight: '80vh'}}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="m-0">Catálogo de Íconos</h5>
                            <button className="btn-close" onClick={() => setShowIconModal(false)}></button>
                        </div>
                        
                        <form onSubmit={handleSearchIcons} className="d-flex gap-2 mb-3">
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Buscar (ej: pizza, user, shop...)" 
                                value={iconSearchTerm}
                                onChange={(e) => setIconSearchTerm(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" className="btn btn-primary" disabled={isSearching}>
                                {isSearching ? '...' : 'Buscar'}
                            </button>
                        </form>

                        <div className="flex-grow-1 overflow-auto border rounded p-2 bg-light">
                            {iconResults.length > 0 ? (
                                <div className="d-flex flex-wrap gap-2 justify-content-center">
                                    {iconResults.map((iconName) => (
                                        <div 
                                            key={iconName}
                                            className="bg-white border rounded d-flex align-items-center justify-content-center icon-hover"
                                            style={{width: '60px', height: '60px', cursor: 'pointer'}}
                                            onClick={() => handleSelectFromApi(iconName)}
                                            title={iconName}
                                        >
                                            <img src={`https://api.iconify.design/${iconName}.svg?width=40&height=40`} alt={iconName} style={{width: '40px', height: '40px', objectFit: 'contain', display: 'block', margin: 'auto'}} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted p-4">
                                    {isSearching ? 'Buscando...' : 'Escribe algo para buscar íconos (en inglés funciona mejor).'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCategories;

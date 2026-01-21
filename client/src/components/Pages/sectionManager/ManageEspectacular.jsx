import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from "../user/UserContext";


// --- CONFIGURACIÓN DE CONEXIÓN ---
// Debe coincidir con la configuración de Espectacular.jsx
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ManageEspectacular = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Estados para el Modal de Edición
    const [editingSlot, setEditingSlot] = useState(null); // 'main', 'banner-0', 'banner-1'
    const [tempSlide, setTempSlide] = useState(null); // Para editar un slide específico
    const { isSpectator, loading: userLoading } = useUser() || { isSpectator: true, loading: true };

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/espectacular`);
            // Aseguramos que la estructura exista aunque venga vacía
            const data = res.data || {};
            if (!data.slider) data.slider = [];
            
            // Normalización de banners (Migración al vuelo de objeto simple a array de slides)
            if (!data.banners) data.banners = [];
            data.banners = data.banners.map((b, idx) => {
                if (!b) return { id: Date.now() + idx, slides: [] }; // Manejar huecos o nulos para evitar errores
                // Si es el formato viejo (sin slides), lo convertimos
                if (!b.slides) {
                    return { id: b.id || Date.now(), slides: [{ ...b, id: Date.now() }] };
                }
                return b;
            });

            if (!data.sectionStyle) data.sectionStyle = {};
            // Solo ponemos default si no existe, para respetar lo que venga de DB
            // Movemos el layout dentro de sectionStyle para asegurar persistencia
            if (!data.sectionStyle.layout) data.sectionStyle.layout = data.layout || 'classic';
            
            setConfig(data);
        } catch (error) {
            console.error("Error loading config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e, type, index = null, isTemp = false) => {
        // Verificación de Modo Espectador
        if (userLoading) {
            alert("Cargando permisos... Por favor espera un momento.");
            return;
        }
        if (isSpectator) {
            alert("Estás en modo espectador. Los cambios no se guardarán por una cuestión de seguridad. El administrador de la página tiene permiso para hacer estos cambios.");
            return;
        }

        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await axios.post(`${BACKEND_URL}/api/espectacular/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Intentamos obtener la URL de varias propiedades posibles para asegurar que la agarre
            const imageUrl = res.data.url || res.data.secure_url || res.data.path;

            if (!imageUrl) {
                alert("Error: La imagen se subió pero no se pudo obtener la URL. Revisa la consola.");
                return;
            }

            // Confirmación visual para el usuario (puedes quitarla luego si molesta)
            // alert(`Imagen subida correctamente: ${imageUrl}`);

            if (isTemp) {
                setTempSlide(prev => ({ ...prev, image: imageUrl }));
                return;
            }

            setConfig(prev => {
                const newConfig = { ...prev };
                if (type === 'background') {
                    newConfig.sectionStyle.backgroundImage = `url(${imageUrl})`;
                } else if (type === 'slider') {
                    newConfig.slider[index].image = imageUrl;
                } else if (type === 'banner') {
                    // En banners ahora buscamos dentro de slides
                    // Nota: Esta función era para subida directa, ahora usaremos el editor de slides
                    // pero la mantenemos por compatibilidad si se usa en otro lado
                    if (newConfig.banners[index] && newConfig.banners[index].slides[0]) {
                        newConfig.banners[index].slides[0].image = imageUrl;
                    }
                }
                return newConfig;
            });
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error al subir la imagen.");
        }
    };

    const handleLayoutChange = (layout) => {
        setConfig(prev => ({ 
            ...prev, 
            sectionStyle: {
                ...prev.sectionStyle,
                layout: layout
            }
        }));
    };

    // --- GESTIÓN DE SLIDES (Bloque Principal) ---
    const handleAddSlide = () => {
        const newSlide = {
            id: Date.now(),
            subtitle: "Nuevo Subtítulo",
            categoryClass: "categories my-3",
            title: "Nuevo Título",
            description: "Descripción...",
            buttonText: "Ver Más",
            discount: "", // Nuevo campo
            image: "",
            link: "#",
            backgroundColor: "bg-info-subtle" // Color por defecto
        };
        // Solo abrimos el editor temporalmente, no lo guardamos en config todavía
        setTempSlide(newSlide); 
    };

    const handleEditSlide = (slide) => {
        setTempSlide({ ...slide });
    };

    const handleRemoveSlide = (id) => {
        if (!window.confirm("¿Eliminar este slide?")) return;
        
        setConfig(prev => {
            const newConfig = { ...prev };
            if (editingSlot === 'main') {
                newConfig.slider = newConfig.slider.filter(s => s.id !== id);
            } else if (editingSlot.startsWith('banner-')) {
                const bannerIndex = parseInt(editingSlot.split('-')[1]);
                if (newConfig.banners[bannerIndex]) {
                    newConfig.banners[bannerIndex].slides = newConfig.banners[bannerIndex].slides.filter(s => s.id !== id);
                }
            }
            return newConfig;
        });

        if (tempSlide && tempSlide.id === id) setTempSlide(null);
    };

    // ESTA ES LA FUNCIÓN QUE FALTABA Y CAUSABA EL ERROR DE PANTALLA BLANCA
    const handleSaveSlide = () => {
        if (!tempSlide) return;
        setConfig(prev => {
            // Deep copy para evitar mutaciones y problemas de referencias
            const newConfig = { 
                ...prev,
                slider: [...(prev.slider || [])],
                banners: [...(prev.banners || [])].map(b => b ? ({...b, slides: [...(b.slides || [])]}) : null),
                sectionStyle: { ...prev.sectionStyle } // Aseguramos que sectionStyle (con el layout) se mantenga
            };

            let targetArray;

            // Determinamos en qué array guardar (Main o Banners)
            if (editingSlot === 'main') {
                targetArray = newConfig.slider;
            } else if (editingSlot.startsWith('banner-')) {
                const bannerIndex = parseInt(editingSlot.split('-')[1]);
                // Aseguramos que el array de banners tenga el tamaño suficiente y sin huecos antes del índice actual
                for (let i = 0; i <= bannerIndex; i++) {
                    if (!newConfig.banners[i]) {
                        newConfig.banners[i] = { id: Date.now() + i, slides: [] };
                    }
                }
                targetArray = newConfig.banners[bannerIndex].slides;
            }

            const index = targetArray.findIndex(s => s.id === tempSlide.id);
            if (index !== -1) {
                targetArray[index] = tempSlide; // Actualizar
            } else {
                targetArray.push(tempSlide); // Agregar
            }

            return newConfig;
        });
        setTempSlide(null); // Cerrar modal
    };

    // --- GUARDAR TODO ---
    const handleSave = async () => {
        // Verificación de Modo Espectador
        if (userLoading) {
            alert("Cargando permisos... Por favor espera un momento.");
            return;
        }
        if (isSpectator) {
            alert("Estás en modo espectador. Los cambios no se guardarán por una cuestión de seguridad. El administrador de la página tiene permiso para hacer estos cambios.");
            return;
        }

        setSaving(true);
        try {
            await axios.put(`${BACKEND_URL}/api/espectacular`, config);
            alert("Configuración guardada exitosamente.");
        } catch (error) {
            console.error("Error saving:", error);
            alert("Error al guardar la configuración.");
        } finally {
            setSaving(false);
        }
    };

    // --- RENDERIZADORES VISUALES ---
    const renderVisualBlock = (type, label, index = null) => {
        let bgImage = "";
        let title = "";
        let bgColorClass = "";
        let count = 0;
        
        if (type === 'main') {
            bgImage = config.slider[0]?.image;
            count = config.slider.length;
            title = `${count} Slide(s)`;
            bgColorClass = config.slider[0]?.backgroundColor || 'bg-info-subtle';
        } else {
            // Accedemos a los slides del banner group
            const bannerGroup = config.banners[index];
            const firstSlide = bannerGroup?.slides?.[0];
            bgImage = firstSlide?.image;
            count = bannerGroup?.slides?.length || 0;
            title = count > 0 ? `${count} Slide(s)` : "Vacío";
            bgColorClass = firstSlide?.backgroundColor || 'bg-light';
        }

        return (
            <div 
                className={`border rounded p-3 text-center d-flex flex-column justify-content-center align-items-center position-relative shadow-sm h-100 ${bgColorClass}`}
                style={{ 
                    cursor: 'pointer', 
                    minHeight: '150px',
                    transition: 'transform 0.2s',
                    overflow: 'hidden'
                }}
                onClick={() => setEditingSlot(type === 'main' ? 'main' : `banner-${index}`)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <div style={{ zIndex: 1, position: 'relative' }}>
                    <div className="fw-bold text-primary mb-1" style={{ textShadow: '0 0 5px rgba(255,255,255,0.8)' }}>{label}</div>
                    <div className="small text-muted" style={{ textShadow: '0 0 5px rgba(255,255,255,0.8)' }}>{title}</div>
                    <div className="mt-2 btn btn-sm btn-outline-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-1"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Editar
                    </div>
                </div>
            </div>
        ); 
    };

 
    if (loading) return <div className="p-5 text-center">Cargando configuración...</div>;
    if (!config) return <div className="p-5 text-center text-danger">Error al cargar la configuración.</div>;

    return (
        <div className="container-fluid p-4">
            {/* Aviso visual de Modo Espectador */}
            {isSpectator && (
                <div className="alert alert-warning mb-4">
                    <strong>Modo Espectador Activo:</strong> Puedes editar y mover elementos para probar la interfaz, pero los cambios no se guardarán en la base de datos.
                </div>
            )}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Editor de Portada (Espectacular)</h3>
                <button className="btn btn-success" onClick={handleSave} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {/* 1. SELECCIÓN DE DISEÑO */}
            <div className="mb-4">
                <h5 className="mb-3">1. Elige la distribución</h5>
                <div className="d-flex gap-3">
                    {[
                        { id: 'classic', label: 'Clásico', icon: 'M4 4h10v16H4z M16 4h4v7h-4z M16 13h4v7h-4z' },
                        { id: 'three-cols', label: '3 Columnas', icon: 'M4 4h4v16H4z M10 4h4v16h-4z M16 4h4v16h-4z' },
                        { id: 'reverse', label: 'Invertido', icon: 'M4 4h4v7H4z M4 13h4v7H4z M10 4h10v16h-10z' },
                        { id: 'horizontal', label: 'Horizontal', icon: 'M4 4h16v10H4z M4 16h7v4H4z M13 16h7v4H13z' }
                    ].map(layout => (
                        <button 
                            key={layout.id}
                            className={`btn ${config.sectionStyle?.layout === layout.id ? 'btn-primary' : 'btn-outline-secondary'} d-flex flex-column align-items-center p-3`}
                            onClick={() => handleLayoutChange(layout.id)}
                            style={{width: '120px'}}
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="mb-2 opacity-50">
                                <path d={layout.icon} />
                            </svg>
                            {layout.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. EDITOR VISUAL */}
            <div className="mb-4">
                <h5 className="mb-3">2. Toca un bloque para editarlo</h5>
                <div className="bg-light p-4 rounded border">
                    {config.sectionStyle?.layout === 'classic' && (
                        <div className="row g-3" style={{height: '400px'}}>
                            <div className="col-8 h-100">{renderVisualBlock('main', 'Principal (Slider)')}</div>
                            <div className="col-4 h-100 d-flex flex-column gap-3">
                                <div className="h-50">{renderVisualBlock('banner', 'Banner Superior', 0)}</div>
                                <div className="h-50">{renderVisualBlock('banner', 'Banner Inferior', 1)}</div>
                            </div>
                        </div>
                    )}
                    {config.sectionStyle?.layout === 'three-cols' && (
                        <div className="row g-3" style={{height: '400px'}}>
                            <div className="col-4 h-100">{renderVisualBlock('main', 'Principal (Slider)')}</div>
                            <div className="col-4 h-100">{renderVisualBlock('banner', 'Banner Central', 0)}</div>
                            <div className="col-4 h-100">{renderVisualBlock('banner', 'Banner Derecho', 1)}</div>
                        </div>
                    )}
                    {config.sectionStyle?.layout === 'reverse' && (
                        <div className="row g-3" style={{height: '400px'}}>
                            <div className="col-4 h-100 d-flex flex-column gap-3">
                                <div className="h-50">{renderVisualBlock('banner', 'Banner Superior', 0)}</div>
                                <div className="h-50">{renderVisualBlock('banner', 'Banner Inferior', 1)}</div>
                            </div>
                            <div className="col-8 h-100">{renderVisualBlock('main', 'Principal (Slider)')}</div>
                        </div>
                    )}
                    {config.sectionStyle?.layout === 'horizontal' && (
                        <div className="d-flex flex-column gap-3" style={{height: '400px'}}>
                            <div className="h-50">{renderVisualBlock('main', 'Principal (Slider)')}</div>
                            <div className="h-50 row g-3 m-0">
                                <div className="col-6 h-100">{renderVisualBlock('banner', 'Banner Izq', 0)}</div>
                                <div className="col-6 h-100">{renderVisualBlock('banner', 'Banner Der', 1)}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE EDICIÓN (Overlay simple) */}
            {editingSlot && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050}}>
                    <div className="bg-white rounded shadow-lg p-4" style={{width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'}}>
                        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                            <h4 className="m-0">
                                {editingSlot === 'main' ? 'Editar Slider Principal' : `Editar Banner ${editingSlot.split('-')[1] === '0' ? '1' : '2'}`}
                            </h4>
                            <button className="btn-close" onClick={() => { setEditingSlot(null); setTempSlide(null); }}></button>
                        </div>

                        {/* EDITOR UNIFICADO (Sirve para Main y Banners) */}
                        {(() => {
                            // Determinamos qué lista mostrar
                            const currentSlides = editingSlot === 'main' 
                                ? config.slider 
                                : (config.banners[parseInt(editingSlot.split('-')[1])]?.slides || []);

                            return (
                            <div>
                                {!tempSlide ? (
                                    // Lista de Slides
                                    <div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <span>Tienes {currentSlides.length} slide(s) activos.</span>
                                            <button className="btn btn-sm btn-success" onClick={handleAddSlide}>+ Nuevo Slide</button>
                                        </div>
                                        <div className="list-group">
                                            {currentSlides.map((slide, idx) => (
                                                <div key={slide.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center">
                                                        <img src={slide.image || "https://placehold.co/50"} alt="" style={{width: '50px', height: '50px', objectFit: 'cover', marginRight: '15px'}} />
                                                        <div>
                                                            <div className="fw-bold">{slide.title}</div>
                                                            <div className="small text-muted">{slide.subtitle}</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEditSlide(slide)}>Editar</button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveSlide(slide.id)}>Borrar</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    // Formulario de Slide Individual
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label">Imagen</label>
                                            <div className="mb-2 bg-light d-flex align-items-center justify-content-center" style={{height: '150px'}}>
                                                {tempSlide.image ? <img src={tempSlide.image} style={{maxWidth:'100%', maxHeight:'100%', objectFit: 'contain'}} /> : <span className="text-muted">Sin imagen</span>}
                                            </div>
                                            <input type="file" className="form-control form-control-sm" onChange={(e) => handleImageUpload(e, 'temp', null, true)} />
                                        </div>
                                        <div className="col-md-8">
                                            <div className="row g-2">
                                                <div className="col-12">
                                                    <label className="form-label small">Descuento / Etiqueta (Opcional)</label>
                                                    <input type="text" className="form-control" value={tempSlide.discount || ''} onChange={e => setTempSlide({...tempSlide, discount: e.target.value})} placeholder="Ej: 20% OFF" />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small">Subtítulo</label>
                                                    <input type="text" className="form-control" value={tempSlide.subtitle} onChange={e => setTempSlide({...tempSlide, subtitle: e.target.value})} />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small">Título</label>
                                                    <input type="text" className="form-control fw-bold" value={tempSlide.title} onChange={e => setTempSlide({...tempSlide, title: e.target.value})} />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small">Descripción</label>
                                                    <textarea className="form-control" rows="2" value={tempSlide.description} onChange={e => setTempSlide({...tempSlide, description: e.target.value})}></textarea>
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small">Texto Botón</label>
                                                    <input type="text" className="form-control" value={tempSlide.buttonText} onChange={e => setTempSlide({...tempSlide, buttonText: e.target.value})} />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small">Enlace</label>
                                                    <input type="text" className="form-control" value={tempSlide.link} onChange={e => setTempSlide({...tempSlide, link: e.target.value})} />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small">Color de Fondo</label>
                                                    <select className="form-select" value={tempSlide.backgroundColor || 'bg-light'} onChange={e => setTempSlide({...tempSlide, backgroundColor: e.target.value})}>
                                                        <option value="bg-white">Blanco</option>
                                                        <option value="bg-light">Gris Claro</option>
                                                        <option value="bg-info-subtle">Azul Suave</option>
                                                        <option value="bg-success-subtle">Verde Suave</option>
                                                        <option value="bg-warning-subtle">Amarillo Suave</option>
                                                        <option value="bg-danger-subtle">Rojo Suave</option>
                                                        <option value="bg-dark-subtle">Oscuro Suave</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 text-end mt-3">
                                            <button className="btn btn-secondary me-2" onClick={() => setTempSlide(null)}>Cancelar</button>
                                            <button className="btn btn-primary" onClick={handleSaveSlide}>Guardar Slide</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageEspectacular;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ProductList from "./ProductList";
import SectionEditor from "./SectionEditor";
import { useUser } from "../user/UserContext";


const ManageSections = () => {
  const [sections, setSections] = useState([]);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const { isSpectator, loading: userLoading } = useUser() || { isSpectator: true, loading: true };

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/sections");
        const sortedSections = response.data.sort((a, b) => a.order - b.order);
        setSections(sortedSections);
      } catch (error) {
        console.error("Error al cargar las secciones:", error);
      }
    };

    fetchSections();
  }, []);

  const handleAddSection = () => {
    const newSection = {
      _id: `new-${Date.now()}`,
      name: "Nueva sección",
      type: "Relevantes",
      order: sections.length,
      products: [],
      isNew: true,
    };
    setSections([...sections, newSection]);
  };

  const handleUpdateSection = (id, updatedSection) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section._id === id ? { ...section, ...updatedSection } : section
      )
    );
    setEditingSectionId(null);
  };

  const handleDeleteSection = (id) => {
    setSections((prevSections) => prevSections.filter((section) => section._id !== id));
  };

  // --- DRAG AND DROP HANDLERS (LIBRERÍA) ---
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedSections = items.map((section, index) => ({
      ...section,
      order: index
    }));

    setSections(updatedSections);
  };

  const handleSaveChanges = async () => {
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
      // Limpiamos el objeto: quitamos 'products' (que puede ser enorme y causar error), __v, fechas, etc.
      const updatedSections = sections.map(({ _id, isNew, products, __v, createdAt, updatedAt, ...section }) => ({
        ...section,
        filters: section.filters || {},
        _id: isNew ? undefined : _id,
      }));

      await axios.post("http://localhost:5000/api/sections/bulk-update", { sections: updatedSections });
      alert("Cambios guardados exitosamente");
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert(`Hubo un error al guardar los cambios: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Header Moderno */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 bg-white p-3 p-md-4 rounded shadow-sm gap-3">
        <div>
          <h3 className="mb-1 fw-bold text-dark">Administrar Secciones</h3>
          <p className="text-muted mb-0 small">Arrastra las tarjetas para reordenar cómo se ven en la tienda.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={handleAddSection}>
              <span className="fs-5 lh-1">+</span> Nueva Sección
            </button>
            <button className="btn btn-success d-flex align-items-center gap-2" onClick={handleSaveChanges}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Guardar Cambios
            </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="d-flex flex-column">
              {sections.map((section, index) => (
                <Draggable key={section._id} draggableId={section._id} index={index} isDragDisabled={!!editingSectionId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`card border-0 shadow-sm overflow-hidden mb-3 ${editingSectionId === section._id ? 'border border-primary border-2' : ''}`}
                      style={{
                        ...provided.draggableProps.style,
                        boxShadow: snapshot.isDragging ? '0 10px 20px rgba(0,0,0,0.15)' : '0 .125rem .25rem rgba(0,0,0,.075)',
                        opacity: snapshot.isDragging ? 0.9 : 1
                      }}
                    >
                      {/* Barra de Título y Acciones */}
                      <div className="card-header bg-white p-3 d-flex flex-wrap align-items-center justify-content-between border-bottom-0 gap-3">
                        <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="me-3 text-muted" {...provided.dragHandleProps} style={{ cursor: editingSectionId ? 'default' : 'grab', flexShrink: 0 }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                            </div>
                             
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <h5 className="m-0 fw-bold text-dark d-flex align-items-center gap-2 flex-wrap">
                                <span className="text-break">{section.name}</span>
                                {section.isNew && <span className="badge bg-info text-dark" style={{fontSize: '0.7em'}}>Nueva</span>}
                              </h5>
                              <small className="text-muted d-block text-truncate" style={{ maxWidth: '100%' }}>
                                {section.type === 'category' && section.filters?.category?.[0] 
                                  ? `Categoría: ${section.filters.category[0]}` 
                                  : `Tipo: ${section.type}`}
                              </small>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button className={`btn btn-sm ${editingSectionId === section._id ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setEditingSectionId(editingSectionId === section._id ? null : section._id)}>
                            {editingSectionId === section._id ? 'Cerrar Edición' : 'Editar'}
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSection(section._id)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>

                      {/* Área de Contenido (Editor o Vista Previa) */}
                      {editingSectionId === section._id ? (
                        <div className="card-body bg-light border-top">
                          <SectionEditor
                            section={section}
                            onUpdate={(updatedSection) => handleUpdateSection(section._id, updatedSection)}
                            onClose={() => setEditingSectionId(null)}
                          />
                        </div>
                      ) : (
                          <div className="card-body p-0 border-top" style={{ opacity: 0.8, pointerEvents: 'none', transform: 'scale(0.98)', transformOrigin: 'top center', maxHeight: '200px', overflow: 'hidden', position: 'relative' }}>
                              <div style={{position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '80px', background: 'linear-gradient(to bottom, rgba(255,255,255,0), #fff)', zIndex: 2}}></div>
                              <ProductList section={section} />
                          </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default ManageSections;

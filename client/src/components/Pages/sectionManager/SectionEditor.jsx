import React, { useState, useEffect } from "react";
import { useApi } from "../../ApiContext";

const SectionEditor = ({ section, onUpdate, onClose }) => {
  const { fetchConfiguration } = useApi();
  const [name, setName] = useState(section?.name || "");
  const [type, setType] = useState(section?.type || "Relevantes");
  const [category, setCategory] = useState(section?.category || "");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setName(section?.name || "");
    setType(section?.type || "Relevantes");
    setCategory(section?.filters?.category?.[0] || "");
  }, [section._id]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchConfiguration();
        if (data && Array.isArray(data.categorias)) {
          setCategories(data.categorias);
        } else {
          console.error("Error: las categorías no están en el formato esperado.");
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };

    loadCategories();
  }, []);

  const handleSave = () => {
    if (type === "category" && !category) {
      alert("Por favor selecciona una categoría para esta sección.");
      return;
    }
    const updatedSection = {
      name,
      type,
      filters: {
        category: type === "category" ? [category] : [],
      },
    };
    onUpdate(updatedSection);
  };

  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    setType(selectedType);
    if (selectedType !== "category") {
      setCategory("");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <h5 className="mb-4 fw-bold text-primary">Editar Configuración de Sección</h5>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="form-floating">
            <input
              type="text"
              id="name"
              className="form-control"
              placeholder="Nombre de la sección"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label htmlFor="name">Nombre Público (Visible en tienda)</label>
          </div>
        </div>

        <div className="col-md-6">
          <div className="form-floating">
            <select
              id="type"
              className="form-select"
              value={type}
              onChange={handleTypeChange}
            >
              <option value="top-sellers">Más comprados</option>
              <option value="category">Por categoría</option>
              <option value="offers">Ofertas</option>
              <option value="recommended">Recomendados</option>
              <option value="favorites">Favoritos</option>
              <option value="new">Nuevos</option>
            </select>
            <label htmlFor="type">Tipo de Contenido</label>
          </div>
        </div>

        {type === "category" && (
          <div className="col-12">
            <div className="form-floating">
              <select
                id="category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Seleccione una categoría...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <label htmlFor="category">Filtrar por Categoría</label>
            </div>
          </div>
        )}
      </div>
      
      <div className="d-flex justify-content-end mt-4 gap-2">
        <button className="btn btn-outline-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-primary px-4" onClick={handleSave}>
          Aplicar Cambios
        </button>
      </div>
    </div>
  );
};

export default SectionEditor;

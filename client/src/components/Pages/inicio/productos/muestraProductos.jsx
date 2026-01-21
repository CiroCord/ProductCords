import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import ProductList from "../../sectionManager/ProductList";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const AdminPanel = () => {
  const [sections, setSections] = useState([]);
  const [editingSectionId, setEditingSectionId] = useState(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/sections`);
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

  const handleSaveChanges = async () => {
    try {
      const updatedSections = sections.map(({ _id, isNew, ...section }) => ({
        ...section,
        filters: section.filters || {},
        id: isNew ? undefined : _id,
      }));

      await axios.post(`${BACKEND_URL}/api/sections/bulk-update`, { sections: updatedSections });
      alert("Cambios guardados exitosamente");
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert("Hubo un error al guardar los cambios.");
    }
  };

  return (
    <div className="container-fluid mt-5">
      {sections.map((section) => (
        <div id={section._id} key={section._id} className=" mb-4">
          <div className="">
            <ProductList section={section} />
          </div>
        </div>
      ))}
    </div>
  ); 
};

export default AdminPanel;

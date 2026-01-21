import React, { createContext, useContext, useState } from "react";
import axios from "axios";

// Crear el contexto
const ApiContext = createContext();

// Crear un hook personalizado para usar el contexto
export const useApi = () => {
  return useContext(ApiContext);
};

// Proveedor del contexto
export const ApiProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const fetchData = async (url, method = "GET", data = null) => {
    setLoading(true);
    try {
      const response = await axios({
        url: `http://localhost:5000${url}`,
        method,
        data,
      });
      return response.data;
    } catch (error) {
      console.error(`Error al realizar la solicitud a ${url}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Funciones específicas para las rutas
  const fetchUsers = () => fetchData("/api/users");
  const fetchProducts = () => fetchData("/api/products");
  const fetchSections = () => fetchData("/api/sections");
  const fetchConfiguration = () => fetchData("/api/configuration");

  const updateSections = (sections) => fetchData("/api/sections/bulk-update", "POST", { sections });

  const value = {
    loading,
    fetchUsers,
    fetchProducts,
    fetchSections,
    fetchConfiguration,
    updateSections,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

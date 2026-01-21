import React from 'react';
import ProductList from '../../sectionManager/ProductList';
const Favorites = () => {
  // Configuración de sección para mostrar favoritos
  const favoritesSection = {
    _id: 'favorites-page',
    name: "Mis Favoritos",
    type: "favorites",
    filters: {}
  };

  return (
    <ProductList section={favoritesSection} />
  );
};

export default Favorites;

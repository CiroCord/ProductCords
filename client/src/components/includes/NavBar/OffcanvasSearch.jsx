import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import '../../../styles/normalize.css'
import '../../../styles/vendor.css'
import '../../../styles/style.css'

const OffcanvasSearch = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [placement, setPlacement] = useState('end');

  useEffect(() => {
    const handleResize = () => {
      setPlacement(window.innerWidth < 992 ? 'bottom' : 'end');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();

    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/configuration");
        if (res.data && res.data.categorias) {
          setCategories(res.data.categorias);
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setCategories([]);
        } else {
          console.error("Error al cargar categorías:", err);
        }
      }
    };
    fetchCategories();
  }, []);

  // Normalizar texto
  const normalizeText = (text) => {
    return text
      ? text.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : "";
  };

  
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

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term || !term.trim()) {
      setSearchResults([]);
      return;
    }

    const normalizedTerm = normalizeText(term);

    const filtered = products.filter(p => {
      const name = normalizeText(p.nombre);
      const category = normalizeText(getCategoryName(p));
      
      return name.includes(normalizedTerm) || category.includes(normalizedTerm) || (category.length > 0 && normalizedTerm.includes(category));
    });

    setSearchResults(filtered);
  };

  return (
   <>
    <li className="d-lg-none">
      <a href="#" className="rounded-circle bg-light p-2 mx-1" data-bs-toggle="offcanvas" data-bs-target="#offcanvasSearch" aria-controls="offcanvasSearch" width="24" height="30">
        <svg  className="icon" width="24" height="24" viewBox="0 0 24 24">
        <use xlinkHref="/icon.svg#search"></use>
        </svg>
      </a>
    </li>
    <div className={`offcanvas offcanvas-${placement}`} data-bs-scroll="true" tabIndex="-1" id="offcanvasSearch" aria-labelledby="Search" style={{ height: placement === 'bottom' ? '70vh' : undefined, borderRadius: placement === 'bottom' ? '1.5rem 1.5rem 0 0' : undefined }}>
      <div className="offcanvas-header justify-content-center">
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div className="offcanvas-body">
        <div className="order-md-last">
          <h4 className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-primary">Buscar</span>
          </h4>
          <form role="search" className="d-flex mt-3 gap-0" onSubmit={(e) => e.preventDefault()}>
            <input 
              className="form-control rounded-start rounded-0 bg-light" 
              type="text" 
              placeholder="¿Que estas buscando?" 
              aria-label="¿Que estas buscando?"
              value={searchTerm}
              onChange={handleSearch}
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {categories.map((cat, index) => (
                <option key={index} value={cat} />
              ))}
            </datalist>
            <button className="btn btn-dark rounded-end rounded-0" type="submit">Buscar</button>
          </form>
          
          {/* Resultados en Offcanvas */}
          {searchResults.length > 0 && (
            <div className="mt-3">
              <ul className="list-group">
                {searchResults.map((product) => (
                  <li key={product._id} className="list-group-item">
                    <Link 
                      to={`/product/${product._id}`} 
                      className="text-decoration-none text-dark d-block"
                      onClick={() => {
                        const closeBtn = document.querySelector('#offcanvasSearch .btn-close');
                        if(closeBtn) closeBtn.click();
                      }}
                    >
                      <div className="fw-bold">{product.nombre}</div>
                      <small className="text-muted">
                        {getCategoryName(product)}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default OffcanvasSearch;
 
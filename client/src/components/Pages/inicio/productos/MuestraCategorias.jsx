import React, { useState, useEffect } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { Link } from "react-router-dom";

const BACKEND_URL = 'http://localhost:5000';

const MuestraCategorias = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/configuration`);
        if (res.data && res.data.categorias) {
          setCategories(res.data.categorias);
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };
    fetchCategories();
  }, []);

  if (!categories || categories.length === 0) return null;

  return (
    <section className="container-fluid mt-5 overflow-hidden">
      <div className="mb-4">
        <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="section-header d-flex flex-wrap justify-content-between mb-5">
              <h2 className="section-title p-3">Categorías</h2>
              
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="category-carousel">
              <Swiper
                modules={[Autoplay]}
                spaceBetween={30}
                slidesPerView={2}
                
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                breakpoints={{
                  576: { slidesPerView: 2 },
                  768: { slidesPerView: 3 },
                  1024: { slidesPerView: 4 },
                  1400: { slidesPerView: 5 }
                }}
                
              >
                {categories.map((cat, index) => {
                  const nombre = typeof cat === 'object' ? cat.nombre : cat;
                  const icono = typeof cat === 'object' ? cat.icono : null;

                  return (
                    <SwiperSlide key={index}>
                      <Link to={`/catalogo?category=${encodeURIComponent(nombre)}`} className="nav-link category-item swiper-slide">
                        {icono ? (
                          // Si hay icono SVG, lo renderizamos
                          <div 
                            className="category-icon mb-3"
                            style={{ width: '60px', height: '60px', margin: '0 auto' }}
                            dangerouslySetInnerHTML={{ __html: icono }} 
                          />
                        ) : (
                          // Placeholder si no hay icono
                          <img src="https://placehold.co/60x60?text=Cat" alt="Category Thumbnail" className="rounded-circle mb-3" />
                        )}
                        <h3 className="category-title">{nombre}</h3>
                      </Link>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default MuestraCategorias;
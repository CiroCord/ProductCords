import React, { useState, useEffect } from "react";
import axios from "axios";

import 'bootstrap/dist/js/bootstrap.bundle.min';
import patron from '../../../assets/placeholder/background-pattern.jpg'

import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css'; 
import 'swiper/css/pagination';
import { useUser } from "../user/UserContext";

// --- CONFIGURACIÓN DE CONEXIÓN ---

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const Espectacular = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSpectatorAlert, setShowSpectatorAlert] = useState(true);
    const { isSpectator } = useUser() || {};

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/api/espectacular`);
                
                // Simplificamos la validación: si hay respuesta, la usamos.
                if (res.data) {
                    setConfig(res.data);
                } else {
                    // Si la respuesta es exitosa (200) pero vacía (null), usamos la config por defecto para que se pueda editar
                    setConfig({ slider: [], banners: [], sectionStyle: { layout: 'classic' } });
                }
            } catch (error) {
                console.error("No se pudo cargar la configuración personalizada, usando defecto.");
                // Usamos una configuración vacía por defecto para que no desaparezca el componente
                setConfig({ slider: [], banners: [], sectionStyle: { layout: 'classic' } });
            }
            finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // Si no hay config y no está cargando, no mostramos nada
    if (!loading && !config) return null;

    const activeConfig = config || {};

    // Extraemos el layout de sectionStyle para no pasarlo como estilo CSS
    const { layout: _layout, ...styleProps } = activeConfig.sectionStyle || {};

    // LÓGICA DE FONDO (PATRÓN):
    // Si la configuración activa no tiene imagen de fondo definida, usamos el patrón por defecto.
    const finalSectionStyle = {
        ...styleProps,
        backgroundImage: styleProps.backgroundImage || `url(${patron})`,
        backgroundSize: styleProps.backgroundSize || 'cover'
    };

    // --- RENDERIZADORES DE BLOQUES ---
    
    // Renderizadores Skeleton (Cargando)
    const renderSkeletonMainBlock = () => (
        <div className="hero-banner large block-1 h-100 bg-light placeholder-glow rounded overflow-hidden" aria-hidden="true">
            <div className="row hero-content p-4 p-lg-5 h-100 align-items-md-center flex-column flex-md-row justify-content-between m-0">
                <div className="content-wrapper col-md-7">
                    <h3 className="placeholder col-6 display-4 fw-bold mb-3"></h3>
                    <p className="placeholder col-12 mb-2"></p>
                    <p className="placeholder col-8 mb-4"></p>
                    <a className="btn btn-secondary disabled placeholder col-4 py-3 rounded-1" style={{height: '50px'}}></a>
                </div>
                <div className="img-wrapper col-md-5 d-flex justify-content-center align-items-center mt-3 mt-md-0">
                    <div className="placeholder col-12 rounded" style={{height: '300px', opacity: 0.2}}></div>
                </div>
            </div>
        </div>
    );

    const renderSkeletonBanner = (heightClass = "") => (
        <div className={`hero-banner bg-light ${heightClass} w-100 placeholder-glow position-relative overflow-hidden rounded`} aria-hidden="true">
            <div className="row hero-content p-4 p-lg-5 h-100 align-items-center position-relative m-0">
                <div className="content-wrapper col-8">
                    <div className="placeholder col-4 mb-3"></div>
                    <h3 className="placeholder col-8 mb-3"></h3>
                    <span className="placeholder col-6"></span>
                </div>
            </div>
        </div>
    );

    // 1. Bloque Principal (Slider)
    const renderMainBlock = () => (
      // Quitamos bg-info fijo para que cada slide tenga su propio color
      <div className="hero-banner large block-1 h-100">
        <Swiper
          modules={[Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          pagination={{ clickable: true }}
          className="h-100"
          
        >
          {(activeConfig.slider || []).map((slide) => (
            <SwiperSlide key={slide.id} className="w-100">
              {/* Aplicamos el color de fondo dinámico aquí */}
              <div className={`row hero-content p-4 p-lg-5 h-100 w-100 align-items-md-center flex-column flex-md-row justify-content-between m-0 ${slide.backgroundColor || 'bg-info-subtle'}`} >
                <div className="content-wrapper col-md-7">
                  <h3 className="display-4 fw-bold">{slide.title}</h3>
                  <p>{slide.description}</p>
                  <a href={slide.link} className="btn btn-outline-dark btn-lg text-uppercase fs-6 rounded-1 px-4 py-3 mt-3">{slide.buttonText}</a>
                </div>
                <div className="img-wrapper col-md-5 d-flex justify-content-center align-items-center mt-3 mt-md-0">
                
                  {/* Volvemos a usar IMG para evitar recortes feos */}
                  <img src={slide.image || "https://placehold.co/400x400?text=Sin+Imagen"} className="img-fluid" alt={slide.title} style={{maxHeight: '400px', width: '100%', objectFit: 'contain'}} />
                    </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );


    // 2. Bloque Secundario (Banner estático)
    const renderBanner = (bannerGroup, heightClass = "") => {
      // Aseguramos valores por defecto para evitar errores de renderizado
      const slides = bannerGroup?.slides || [];
      
      // Si no hay slides, mostramos vacío o placeholder
      if (slides.length === 0) {
          return <div className={`hero-banner bg-light ${heightClass} d-flex align-items-center justify-content-center text-muted`}>Vacío</div>;
      }

      // Función para renderizar el contenido de un slide individual
      const renderSlideContent = (slide) => (
        <div className={`hero-banner ${slide.backgroundColor || 'bg-light'} ${heightClass} position-relative overflow-hidden w-100 h-100`} style={{ backgroundImage: `url('${slide.image || ""}')`, backgroundRepeat: "no-repeat", backgroundPosition: "bottom right", backgroundSize: 'contain' }}>
             {/* Capa para asegurar legibilidad si no hay imagen de fondo o es muy clara */}
            <div className="row hero-content p-4 p-lg-5 h-100 align-items-center position-relative m-0" style={{zIndex: 2}}>
              <div className="content-wrapper col-8">
                <div className={slide.categoryClass}>{slide.discount || slide.subtitle}</div>
                <h3 className={slide.titleClass}>{slide.title}</h3>
                <a href={slide.link || "#"} className="d-flex align-items-center nav-link mt-2">{slide.buttonText || "Shop Collection"} <svg width="24" height="24" className="ms-2"><use xlinkHref="/icon.svg#arrow-right"></use></svg></a>
              </div>
            </div> 
        </div>
      );

      // Si hay más de 1 slide, usamos Swiper
      if (slides.length > 1) {
          return (
            // CORRECCIÓN: Quitamos 'hero-banner' del contenedor para evitar doble padding/margen
            <div className={`${heightClass} overflow-hidden w-100`}>
                <Swiper
                    modules={[Pagination]}
                    spaceBetween={0}
                    slidesPerView={1}
                    pagination={{ clickable: true }}
                    className="h-100"
                >
                    {slides.map(slide => (
                        <SwiperSlide key={slide.id} className="h-100 w-100">
                            {renderSlideContent(slide)}
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
          );
      }

      // Si es solo 1, renderizamos estático
      return renderSlideContent(slides[0]);
    };

    // --- LÓGICA DE LAYOUTS ---
    const renderLayout = () => {
      if (loading) {
        // Layout Skeleton (usamos estructura clásica por defecto)
        return (
            <div className="row g-4">
              <div className="col-lg-8" style={{minHeight: '600px'}}>
                {renderSkeletonMainBlock()}
              </div>
              <div className="col-lg-4 d-flex flex-column gap-4">
                <div style={{flex: 1}}>{renderSkeletonBanner('h-100')}</div>
                <div style={{flex: 1}}>{renderSkeletonBanner('h-100')}</div>
              </div>
            </div>
        );
      }

      // Leemos el layout desde sectionStyle (donde lo guardamos ahora) o fallback al root/default
      const layout = config?.sectionStyle?.layout || config?.layout || 'classic';
      const banner1 = activeConfig.banners?.[0] || {};
      const banner2 = activeConfig.banners?.[1] || {};

      switch (layout) {
        case 'three-cols': // 3 Columnas verticales iguales
          return (
            <div className="row g-4">
              <div className="col-lg-4 col-md-6" style={{minHeight: '500px'}}>{renderMainBlock()}</div>
              <div className="col-lg-4 col-md-6" style={{minHeight: '500px'}}>{renderBanner(banner1, 'h-100')}</div>
              <div className="col-lg-4 col-md-12" style={{minHeight: '500px'}}>{renderBanner(banner2, 'h-100')}</div>
            </div>
          );
        case 'reverse': // Banners a la izquierda, Principal a la derecha
          return (
            <div className="row g-4">
              <div className="col-lg-4 d-flex flex-column gap-4">
                <div style={{flex: 1}}>{renderBanner(banner1, 'h-100')}</div>
                <div style={{flex: 1}}>{renderBanner(banner2, 'h-100')}</div>
              </div>
              <div className="col-lg-8" style={{minHeight: '600px'}}>
                {renderMainBlock()}
              </div>
            </div>
          );
        case 'horizontal': // NUEVO DISEÑO: Principal arriba, Banners abajo
          return (
            <div className="d-flex flex-column gap-4">
              <div style={{minHeight: '450px'}}>{renderMainBlock()}</div>
              <div className="row g-4">
                 <div className="col-md-6" style={{minHeight: '300px'}}>{renderBanner(banner1, 'h-100')}</div>
                 <div className="col-md-6" style={{minHeight: '300px'}}>{renderBanner(banner2, 'h-100')}</div>
              </div>
            </div>
          );
        case 'classic': // Principal izquierda, Banners derecha (Default)
        default:
          return (
            <div className="row g-4">
              <div className="col-lg-8" style={{minHeight: '600px'}}>
                {renderMainBlock()}
              </div>
              <div className="col-lg-4 d-flex flex-column gap-4">
                <div style={{flex: 1}}>{renderBanner(banner1, 'h-100')}</div>
                <div style={{flex: 1}}>{renderBanner(banner2, 'h-100')}</div>
              </div>
            </div>
          );
      }
    };

    return (
    
        
    <section className="py-3 position-relative" style={loading ? {} : finalSectionStyle}>
    {showSpectatorAlert && !isSpectator && (
        <div className="container mb-3">
            <div className="alert alert-info alert-dismissible fade show shadow-sm border-info" role="alert">
                <strong>👋 ¡Estás de visita!</strong> Para acceder al <strong>Modo Espectador</strong> y ver lo que vería el admin, ingresa con el mail: <code>espectador@example.com</code> y contraseña: <code>admin26</code>.
                <button type="button" className="btn-close" onClick={() => setShowSpectatorAlert(false)} aria-label="Close"></button>
            </div>
        </div>
    )}
    <div className="container-fluid">
      {renderLayout()}
    </div>
  </section>

    )
}

export default Espectacular

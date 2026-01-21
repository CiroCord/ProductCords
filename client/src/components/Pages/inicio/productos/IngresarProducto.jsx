import React, { useState, useRef, useEffect } from "react";
import "cropperjs/dist/cropper.css";
import Cropper from "react-cropper";
import axios from "axios";
import "../../../../styles/forms.css";
import { useUser } from "../../user/UserContext";


const ProductForm = ({ existingProduct, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    precioOriginal: "",
    precioDescuento: "",
    categoria: "",
    tiempo: "",
    peso: "",
    descripcion: "",
    image: null,
    images: []
  });

  const [image, setImage] = useState(null);
  const [images, setImages] = useState([]); 
  const [croppedImage, setCroppedImage] = useState(null); 
  const [message, setMessage] = useState(null); // Feedback para el usuario
  const cropperRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]); // Estado para categorías dinámicas
  const { isSpectator, loading: userLoading } = useUser() || { isSpectator: true, loading: true };

  // Cargar categorías al montar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/configuration");
        setCategories(res.data.categorias || []);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };
    fetchCategories();
  }, []);

  // Efecto para cargar datos si estamos editando
  useEffect(() => {
    if (existingProduct) {
      // Normalizar categoría (puede venir como array, objeto o string)
      let catValue = "";
      if (Array.isArray(existingProduct.categoria)) {
        const first = existingProduct.categoria[0];
        catValue = (typeof first === 'object' ? first.nombre : first) || "";
      } else if (typeof existingProduct.categoria === 'object') {
        catValue = existingProduct.categoria?.nombre || "";
      } else {
        catValue = existingProduct.categoria || "";
      }

      setFormData({
        ...existingProduct,
        categoria: catValue,
        image: existingProduct.image || null,
        images: existingProduct.images || [],
        precioDescuento: existingProduct.precioDescuento || "" // Evitamos null para que no se envíe como string "null"
      });
      setImage(existingProduct.image || null);
      setCroppedImage(existingProduct.image || null);
      setImages(existingProduct.images || []);
    }
  }, [existingProduct]);

  // Helper para obtener el blob de la imagen recortada (Promesa)
  const getCroppedBlob = () => {
    return new Promise((resolve) => {
      const cropper = cropperRef.current?.cropper;
      if (!cropper) {
        resolve(null);
        return;
      }
      cropper.getCroppedCanvas({ width: 1080, height: 1080 }).toBlob((blob) => {
        resolve(blob);
      }, "image/png", 1);
    });
  };

  // Función para el botón manual "Recortar" (ahora opcional pero útil)
  const handleCrop = async () => {
    const blob = await getCroppedBlob();
    if (blob) {
      setFormData((prev) => ({ ...prev, image: blob }));
    }
  };

  // Función para manejar cambios en los campos de formulario
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image" && files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result); // Leemos el archivo y lo asignamos a `image`
      reader.readAsDataURL(files[0]);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Función para manejar el cambio de archivos adicionales
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Convertimos cada archivo a Blob antes de agregarlo al estado
    const fileBlobs = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const blob = new Blob([reader.result], { type: "image/png" });
          resolve(blob); // Guardamos como Blob
        };
        reader.readAsArrayBuffer(file); // Convertimos a ArrayBuffer primero
      });
    });

    // Esperamos que todas las imágenes se conviertan a Blob
    Promise.all(fileBlobs).then((blobs) => {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...blobs],  // Guardamos los Blobs
      }));

      // También actualizamos la vista previa de las imágenes
      const imageUrls = files.map(file => URL.createObjectURL(file));
      setImages(prevImages => [...prevImages, ...imageUrls]);
    });
  };

  // Función para eliminar una imagen del array
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Función para eliminar la imagen principal
  const handleDeleteImage = () => {
    setImage(null);
    setCroppedImage(null);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  // Función para calcular el precio con descuento
  const calcularPrecioConDescuento = () => {
    const { precioOriginal, precioDescuento } = formData;
    if (precioOriginal && precioDescuento) {
      return (
        precioOriginal - (precioOriginal * precioDescuento) / 100
      ).toFixed(2);
    }
    return precioOriginal || "0.00";
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({
      nombre: "",
      precioOriginal: "",
      precioDescuento: "",
      categoria: "Seleccione una categoría",
      tiempo: "",
      peso: "",
      descripcion: "",
      image: null,
      images: []
      
    });
    setImage(null);
    setCroppedImage(null);
    setImages([]);
  };

  // Función para enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificación de Modo Espectador
    if (userLoading) {
        alert("Cargando permisos... Por favor espera un momento.");
        return;
    }
    if (isSpectator) {
        alert("Estás en modo espectador. Los cambios no se guardarán por una cuestión de seguridad. El administrador de la página tiene permiso para hacer estos cambios.");
        return;
    }

    setLoading(true);
    
    // --- AUTO-CROP: Si hay imagen en el editor, la recortamos automáticamente al guardar ---
    let finalImage = formData.image;
    
    // Si hay una imagen visualizada (state 'image') y el cropper está activo
    if (image && cropperRef.current?.cropper) {
      try {
        const blob = await getCroppedBlob();
        if (blob) finalImage = blob;
      } catch (err) {
        console.error("Error en auto-crop:", err);
      }
    }

    const { nombre, precioOriginal, tiempo, categoria } = formData;

    if (!nombre || !precioOriginal || !tiempo || !categoria || !finalImage) {
      setMessage("Por favor, completa todos los campos obligatorios.");
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();

    // Agregamos la imagen principal (usando la procesada finalImage)
    if (finalImage) {
      if (typeof finalImage === 'string') {
        formDataToSend.append("image", finalImage); // Enviar URL existente
      } else {
        formDataToSend.append("image", finalImage, "imagen.png"); // Enviar Blob nuevo
      }
    }

    // Agregamos las imágenes adicionales (archivos reales)
    formData.images.forEach((img, index) => {
      if (typeof img === 'string') {
        formDataToSend.append("images", img); // Enviar URL existente
      } else {
        formDataToSend.append("images", img, `imagen${index}.png`); // Enviar Blob nuevo
      }
    });

    // Agregamos el resto de los campos del formulario
    Object.keys(formData).forEach((key) => {
      if (key !== "image" && key !== "images") {
        // Si el valor es null, enviamos cadena vacía para evitar que FormData envíe "null" literal
        const value = formData[key] === null ? "" : formData[key];
        formDataToSend.append(key, value);
      }
    });
    console.log(formData)
    try {
      if (existingProduct) {
        // MODO EDICIÓN
        await axios.put(
          `http://localhost:5000/api/products/${existingProduct._id}`,
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setMessage("Producto actualizado con éxito.");
      } else {
        // MODO CREACIÓN
        await axios.post(
          "http://localhost:5000/api/products",
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setMessage("Producto creado con éxito.");
        resetForm();
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error al crear el producto:", error.response || error);
      setMessage("Hubo un error al guardar el producto.");
    }finally {
      setLoading(false); // Desactivar el estado de carga
  }
  };

  return (
    <div className="container mt-4 mb-5">
      {/* Aviso visual de Modo Espectador */}
      {isSpectator && (
          <div className="alert alert-warning mb-4 shadow-sm">
              <strong>Modo Espectador:</strong> Puedes completar el formulario y probar las herramientas, pero el producto no se creará ni actualizará realmente.
          </div>
      )}
      <form onSubmit={handleSubmit} className="shadow p-4 rounded bg-white">
        <div className="row g-5">
          
          {/* 1. SECCIÓN DE DATOS (Arriba en móvil, Derecha en escritorio) */}
          {/* Usamos 'order' para cambiar el orden visual según el dispositivo */}
          <div className="col-lg-6 order-1 order-lg-2">
            <h4 className="mb-4 fw-bold text-primary">{existingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h4>
            
            <div className="row g-3">
              <div className="col-12">
                <div className="form-floating">
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    className="form-control"
                    required
                    placeholder="Nombre"
                    onChange={handleChange}
                    value={formData.nombre}
                  />
                  <label htmlFor="nombre">Nombre del Producto</label>
                </div>
              </div>

              <div className="col-6">
                <div className="form-floating">
                  <input
                    type="number"
                    id="precioOriginal"
                    name="precioOriginal"
                    className="form-control"
                    required
                    placeholder="Precio"
                    onChange={handleChange}
                    value={formData.precioOriginal}
                  />
                  <label htmlFor="precioOriginal">Precio ($)</label>
                </div>
              </div>

              <div className="col-6">
                <div className="form-floating">
                  <input
                    type="number"
                    id="precioDescuento"
                    name="precioDescuento"
                    className="form-control"
                    placeholder="%"
                    onChange={handleChange}
                    value={formData.precioDescuento}
                  />
                  <label htmlFor="precioDescuento">Descuento (%)</label>
                </div>
              </div>

              <div className="col-6">
                <div className="form-floating">
                  <select
                    id="categoria"
                    name="categoria"
                    className="form-select"
                    onChange={handleChange}
                    value={formData.categoria}
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map((cat, index) => {
                      // Manejo seguro tanto si es string (viejo) como objeto (nuevo)
                      const catName = typeof cat === 'object' ? cat.nombre : cat;
                      return <option key={index} value={catName}>{catName}</option>;
                    })}
                  </select>
                  <label htmlFor="categoria">Categoría</label>
                </div>
              </div>

              <div className="col-6">
                <div className="form-floating">
                  <input
                    type="number"
                    id="peso"
                    name="peso"
                    className="form-control"
                    placeholder="Gramos"
                    required
                    onChange={handleChange}
                    value={formData.peso}
                  />
                  <label htmlFor="peso">Peso (gr)</label>
                </div>
              </div>

              <div className="col-12">
                <div className="form-floating">
                  <input
                    type="number"
                    id="tiempo"
                    name="tiempo"
                    className="form-control"
                    placeholder="Días"
                    required
                    onChange={handleChange}
                    value={formData.tiempo}
                  />
                  <label htmlFor="tiempo">Tiempo de entrega (días)</label>
                </div>
              </div>

              <div className="col-12">
                <div className="form-floating">
                  <textarea
                    value={formData.descripcion}
                    id="descripcion"
                    name="descripcion"
                    className="form-control"
                    placeholder="Descripción"
                    style={{ height: '120px' }}
                    onChange={handleChange}
                  ></textarea>
                  <label htmlFor="descripcion">Descripción</label>
                </div>
              </div>
            </div>

            <div className="mt-4 d-none d-lg-block">
              {/* Botón visible solo en escritorio */}
              <button type="submit" className="btn btn-success w-100 py-3 fw-bold" disabled={loading}>
                {loading ? 'Guardando...' : (existingProduct ? 'Actualizar Producto' : 'Crear Producto')}
              </button>
            </div>
          </div>

          {/* 2. SECCIÓN DE IMAGEN (Abajo en móvil, Izquierda en escritorio) */}
          <div className="col-lg-6 order-2 order-lg-1">
            <div className="p-3 border rounded bg-light h-100">
              <label className="form-label fw-bold mb-3">Imagen Principal</label>
              
              {/* CONTENEDOR CUADRADO RESPONSIVE (aspectRatio: 1/1) */}
              <div className="position-relative w-100 bg-dark rounded overflow-hidden" style={{ aspectRatio: '1/1' }}>
                  {image ? (
                        <Cropper
                          src={image}
                          style={{ height: "100%", width: "100%" }}
                          initialAspectRatio={1}
                          aspectRatio={1}
                          viewMode={1}
                          guides={true}
                      autoCropArea={1}
                          responsive={true}
                          checkOrientation={false}
                          ref={cropperRef}
                          dragMode="move"
                      background={false}
                        />
                  ) : (
                    <div className="w-100 h-100 d-flex flex-column justify-content-center align-items-center text-muted file-upload-design">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" className="mb-2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      <span style={{color: 'white'}}>Subir Imagen</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleChange} 
                        name="image"
                        className="position-absolute top-0 start-0 w-100 h-100 opacity-0" 
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  )}
              </div>

              {/* CONTROLES IMAGEN */}
              {image && (
                <div className="d-flex gap-2 mt-3 justify-content-center">
                  <button type="button" onClick={handleCrop} className="btn btn-primary btn-sm px-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>
                    Recortar
                  </button>
                  <button type="button" onClick={handleDeleteImage} className="btn btn-danger btn-sm px-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Eliminar
                  </button>
                </div>
              )}

              {/* IMÁGENES ADICIONALES */}
              <div className="mt-4 pt-3 border-top">
                <label className="form-label small fw-bold">Galería Adicional</label>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="form-control form-control-sm mb-2" />
                <div className="d-flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="position-relative" style={{width: '60px', height: '60px'}}>
                      <img src={img} className="w-100 h-100 rounded border" style={{ objectFit: 'cover' }} alt="" />
                      <button type="button" onClick={() => handleRemoveImage(idx)} className="btn btn-danger p-0 position-absolute top-0 end-0 rounded-circle d-flex align-items-center justify-content-center" style={{width:'18px', height:'18px', transform: 'translate(30%, -30%)'}}>
                        <span style={{fontSize:'12px', lineHeight:1}}>&times;</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botón Mobile (para que quede abajo de todo en mobile) */}
            <div className="mt-4 d-lg-none">
              <button type="submit" className="btn btn-success w-100 py-2 fw-bold" disabled={loading}>
                {loading ? 'Guardando...' : (existingProduct ? 'Actualizar Producto' : 'Crear Producto')}
              </button>
            </div>
          </div>

        </div>
        
        {message && <div className={`alert mt-4 ${message.includes('éxito') ? 'alert-success' : 'alert-danger'}`}>{message}</div>}
      </form>
    </div>
  );
};

export default ProductForm;

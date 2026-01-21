import Configuracion from "../models/Configuracion.js";

const normalizeCategories = (categorias) => {
  return categorias.map(cat => {
    if (typeof cat === 'string') {
      return { nombre: cat, icono: '' };
    }
    return cat;
  });
};

export const getConfiguration = async (req, res) => {
  try {
    let rawConfig = await Configuracion.findOne().lean();
    
    if (!rawConfig) {
      return res.status(404).json({ message: "Configuración no encontrada" });
    }

    if (rawConfig.categorias && rawConfig.categorias.some(c => typeof c === 'string')) {
        const fixedCategories = normalizeCategories(rawConfig.categorias);
        
        await Configuracion.updateOne({ _id: rawConfig._id }, { $set: { categorias: fixedCategories } });
        
        const config = await Configuracion.findOne();
        await config.save();
        return res.json(config);
    }

    const config = await Configuracion.findOne();
    res.json(config);
  } catch (error) {
    console.error("Error en getConfiguration:", error);
    res.status(500).json({ message: "Error al obtener la configuración", error });
  }
};
export const createDefaultConfig = async () => {
  try {
    const existingConfig = await Configuracion.findOne();

    if (!existingConfig) {
      const defaultConfig = new Configuracion({
        categorias: [
          { nombre: 'Comida', icono: '<svg fill="#ffb350" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M29.22,13.95h-.28v-2.07c0-4.75-5.76-8.61-12.84-8.61S3.26,7.14,3.26,11.88v2.07h-.48c-.84,0-1.52,.68-1.52,1.52v1.06c0,.84,.68,1.52,1.52,1.52h.48v2.07c0,4.74,5.76,8.6,12.84,8.6s12.84-3.86,12.84-8.6v-2.07h.28c.84,0,1.52-.68,1.52-1.52v-1.06c0-.84-.68-1.52-1.52-1.52ZM16.1,4.78c5.85,0,10.68,2.79,11.28,6.36H4.82c.6-3.57,5.43-6.36,11.28-6.36ZM4.76,12.63H27.44v1.32H4.76v-1.32Zm11.34,14.58c-5.85,0-10.68-2.79-11.28-6.35h12.49l1.8,3c.14,.23,.38,.36,.64,.36s.51-.14,.64-.36l1.8-3h5.17c-.6,3.56-5.43,6.35-11.28,6.35Zm11.34-7.85h-5.66c-.26,0-.51,.14-.64,.36l-1.38,2.29-1.38-2.29c-.14-.23-.38-.36-.64-.36H4.76v-1.32H27.44v1.32Zm1.78-2.82l-26.46-.02,.02-1.08h1.22s0,0,0,0H28.19s0,0,0,0h1.02s.02,.02,.02,.02l-.02,1.08Z"></path></g></svg>' },
          { nombre: 'Bebidas', icono: '<svg viewBox="-4 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#bde7b5"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>drink_round [#682]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-304.000000, -5159.000000)" fill="#bde7b5"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M258,5006 C258,5008.339 255.993,5010.209 253.607,5009.981 C251.527,5009.783 250,5007.917 250,5005.828 L250,5002 C250,5001.448 250.448,5001 251,5001 L257,5001 C257.552,5001 258,5001.448 258,5002 L258,5006 Z M250,4999 C248.895,4999 248,4999.895 248,5001 L248,5006 C248,5008.972 250,5011.433 253,5011.91 L253,5017 L252,5017 C251.448,5017 251,5017.448 251,5018 C251,5018.552 251.448,5019 252,5019 L256,5019 C256.552,5019 257,5018.552 257,5018 C257,5017.448 256.552,5017 256,5017 L255,5017 L255,5011.91 C258,5011.433 260,5008.972 260,5006 L260,5001 C260,4999.895 259.105,4999 258,4999 L250,4999 Z" id="drink_round-[#682]"> </path> </g> </g> </g> </g></svg>' },
          { nombre: 'Postre', icono: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#a4d3e6"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#a4d3e6" d="M128.64 448a208 208 0 0 1 193.536-191.552 224 224 0 0 1 445.248 15.488A208.128 208.128 0 0 1 894.784 448H896L548.8 983.68a32 32 0 0 1-53.248.704L128 448h.64zm64.256 0h286.208a144 144 0 0 0-286.208 0zm351.36 0h286.272a144 144 0 0 0-286.272 0zm-294.848 64 271.808 396.608L778.24 512H249.408zM511.68 352.64a207.872 207.872 0 0 1 189.184-96.192 160 160 0 0 0-314.752 5.632c52.608 12.992 97.28 46.08 125.568 90.56z"></path></g></svg>' }
        ], 
      });

      await defaultConfig.save();
    }
  } catch (error) {
    console.error('Error al crear la configuración predeterminada', error);
  }
};


export const updateCategories = async (req, res) => {
  const { categorias } = req.body;

  if (!Array.isArray(categorias)) {
    return res.status(400).json({ message: "El campo 'categorias' debe ser un array" });
  }

  try {
    const config = await Configuracion.findOne();
    if (!config) {
      const newConfig = new Configuracion({ categorias });
      await newConfig.save();
      return res.status(201).json(newConfig);
    }

    config.categorias = categorias;
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar las categorías", error });
  }
};

export const addCategory = async (req, res) => {
  const { nombre, icono } = req.body;

  if (!nombre || typeof nombre !== "string") {
    return res.status(400).json({ message: "El nombre de la categoría es obligatorio" });
  }

  try {
    let config = await Configuracion.findOne();
    
    if (!config) {
        let raw = await Configuracion.findOne().lean();
        if (raw) {
            const fixedCategories = normalizeCategories(raw.categorias);
            await Configuracion.updateOne({ _id: raw._id }, { $set: { categorias: fixedCategories } });
            config = await Configuracion.findOne();
        } else {
            const newConfig = new Configuracion({ categorias: [{ nombre, icono }] });
            await newConfig.save();
            return res.status(201).json(newConfig);
        }
    }

    if (config.categorias.some(c => c.nombre === nombre)) {
      return res.status(400).json({ message: "La categoría ya existe" });
    }

    config.categorias.push({ nombre, icono });
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Error al agregar la categoría", error });
  }
};

export const removeCategory = async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: "El campo 'category' es obligatorio y debe ser una cadena" });
  }

  try {
    let config = await Configuracion.findOne();
    if (!config) {
      return res.status(404).json({ message: "Configuración no encontrada" });
    }

    const rawConfig = config.toObject();
    if (rawConfig.categorias && rawConfig.categorias.some(c => typeof c === 'string')) {
        config.categorias = normalizeCategories(rawConfig.categorias);
        await config.save();
    }

    const index = config.categorias.findIndex(c => c.nombre === nombre);
    if (index === -1) {
      return res.status(400).json({ message: "La categoría no existe" });
    }

    config.categorias.splice(index, 1);
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la categoría", error });
  }
};

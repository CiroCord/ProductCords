import Section from '../models/Section.js';
import Configuracion from '../models/Configuracion.js';

export const createSection = async (req, res) => {
  try {
    const { name, type, products = [] } = req.body;
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const lastSection = await Section.findOne().sort({ customId: -1 }).exec();
    const customId = lastSection ? lastSection.customId + 1 : 1;

    const section = new Section({ customId, name, type, products });
    await section.save();

    res.status(201).json(section);
  } catch (error) {
    console.error('Error al crear la sección:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getSections = async (req, res) => {
  try {
    const sections = await Section.find().sort({ order: 1 });
    res.json(sections);
  } catch (error) {
    console.error('Error al obtener las secciones:', error);
    res.status(500).json({ message: 'Error al obtener las secciones', error });
  }
};

export const updateSection = async (req, res) => {
  const { id } = req.params;
  const { name, type, category } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: 'Name and type are required' });
  }

  try {
    const updatedSection = await Section.findByIdAndUpdate(
      id,
      { name, type, category },
      { new: true }
    );
    res.json(updatedSection);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar la sección', error });
  }
};

export const updateSections = async (req, res) => {
  try {
    const { sections } = req.body;

    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ message: 'Secciones inválidas' });
    }

    await Section.deleteMany();

    const sectionsToInsert = sections.map((section, index) => ({
      ...section,
      _id: section._id || section.id,
      customId: index + 1,
      order: index
    }));

    const newSections = await Section.insertMany(sectionsToInsert);

    res.json({ message: 'Secciones reemplazadas correctamente', newSections });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor', error });
  }
};


export const deleteSection = async (req, res) => {
  const { id } = req.params;

  try {
    const section = await Section.findByIdAndDelete(id);

    if (!section) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }

    const remainingSections = await Section.find().sort('order');
    remainingSections.forEach((sec, index) => {
      sec.order = index;
      sec.save();
    });

    res.json({ message: 'Sección eliminada y orden actualizado' });
  } catch (error) {
    res.status(400).json({ message: 'Error al eliminar la sección', error });
  }
};

export const createDefaultSections = async () => {
  try {
    const existingSections = await Section.find();

    if (existingSections.length === 0) {
      const sectionTypes = [
        { name: "Más comprados", type: "top-sellers", order: 0 },
        { name: "Por categoría", type: "category", filters: { category: "Comida" }, order: 1 },
        { name: "Ofertas", type: "offers", order: 2 },
        { name: "Recomendados", type: "recommended", order: 3 },
        { name: "Favoritos", type: "favorites", order: 4 },
        { name: "Nuevos", type: "new", order: 5 },
      ];

      let lastCustomId = (await Section.findOne().sort({ customId: -1 }).exec())?.customId || 0;

      for (let section of sectionTypes) {
        lastCustomId += 1;
        const newSection = new Section({ ...section, customId: lastCustomId });
        await newSection.save();
      }
    }
  } catch (error) {
    console.error('Error al crear las secciones predeterminadas', error);
  }
};

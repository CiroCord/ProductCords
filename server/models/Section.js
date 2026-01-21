import mongoose from 'mongoose';

const SectionSchema = new mongoose.Schema({
  customId: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    default: 0, // Valor por defecto para el orden
  },
  products: {
    type: Array,
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  filters: {
    category: {
      type: [String], // Almacena una lista de categorías
      default: [],
    },
  },
});

const Section = mongoose.model('Section', SectionSchema);
export default Section;

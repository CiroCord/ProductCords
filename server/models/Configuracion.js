import mongoose from 'mongoose';

const configuracionSchema = new mongoose.Schema({
   categorias: {
    type: [String],
    required: true,
    default: [],
    type: [{
      nombre: { type: String, required: true },
      icono: { type: String, default: '' }
    }], 
    default: []
   },
  }
 );

const Configuracion = mongoose.model('Configuracion', configuracionSchema);

export default Configuracion; 
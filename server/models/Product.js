// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    precioOriginal: { type: Number, required: true },
    precioDescuento: { type: Number, default: null },
    tiempo: { type: Number, required: true },
    categoria: { type: [String], required: true },
    compras: { type: Number, default: 0 },
    estrellas:{type: Number, default:0},
    peso:{type:Number, default:0},
    descripcion: { type: String, required: true },
    image: { type: String, default: ''},
    images: { type: [String], default: []}  
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export default Product;

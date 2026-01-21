import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
    password: { type: String, required: true },
    fechaNacimiento: { type: Date, required: true },
    provincia: { type: String },
    localidad: { type: String },
    telefono: { type: String },
    productosComprados: {type: [Number] },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    productosCarrito: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number, default: 1 }
        }
    ],
    verificationCode: { type: String }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
 
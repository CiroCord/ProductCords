import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        default: 'pending'
    },
    total: {
        type: Number,
        required: true
    },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    expireAt: { type: Date }
}, { timestamps: true });

orderSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Order', orderSchema);
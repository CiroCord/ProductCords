import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true },
    
    totalRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },

    newUsers: { type: Number, default: 0 },
    
    topProducts: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: Number,
        revenue: Number
    }],
    categorySales: [{
        category: String,
        revenue: Number,
        count: Number
    }],

    abandonedCartsCount: { type: Number, default: 0 },
    potentialCartRevenue: { type: Number, default: 0 }

}, { timestamps: true });

export default mongoose.model('Status', statusSchema);
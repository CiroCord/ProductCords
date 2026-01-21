import Status from '../models/Status.js';
import Order from '../models/Order.js';
import User from '../models/user.js';

export const generateDailyStatus = async (req, res) => {
    try {
        const targetDate = req.body.date ? new Date(req.body.date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const ordersData = await Order.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: targetDate, $lt: nextDay },
                    status: { $ne: 'cancelled' }
                } 
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$total" },
                    totalOrders: { $sum: 1 },
                    items: { $push: "$items" }
                }
            }
        ]);

        const stats = ordersData[0] || { totalRevenue: 0, totalOrders: 0, items: [] };
        const averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

        const productStats = await Order.aggregate([
            { $match: { createdAt: { $gte: targetDate, $lt: nextDay }, status: { $ne: 'cancelled' } } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$items.product",
                    name: { $first: "$productDetails.nombre" },
                    category: { $first: "$productDetails.categoria" },
                    quantity: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        const topProducts = productStats.slice(0, 5).map(p => ({
            product: p._id,
            name: p.name,
            quantity: p.quantity,
            revenue: p.revenue
        }));

        const categoryMap = {};
        productStats.forEach(p => {
            const cats = Array.isArray(p.category) ? p.category : [p.category];
            cats.forEach(c => {
                if (!c) return;
                if (!categoryMap[c]) categoryMap[c] = { revenue: 0, count: 0 };
                categoryMap[c].revenue += p.revenue;
                categoryMap[c].count += p.quantity;
            });
        });

        const categorySales = Object.keys(categoryMap).map(key => ({
            category: key,
            revenue: categoryMap[key].revenue,
            count: categoryMap[key].count
        }));

        const newUsers = await User.countDocuments({
            createdAt: { $gte: targetDate, $lt: nextDay }
        });

        const usersWithCart = await User.find({ "productosCarrito.0": { $exists: true } }).populate('productosCarrito.product');
        
        let potentialCartRevenue = 0;
        usersWithCart.forEach(u => {
            u.productosCarrito.forEach(item => {
                if(item.product) {
                    const price = item.product.precioDescuento 
                        ? item.product.precioOriginal * (1 - item.product.precioDescuento/100) 
                        : item.product.precioOriginal;
                    potentialCartRevenue += price * item.quantity;
                }
            });
        });

        const statusReport = await Status.findOneAndUpdate(
            { date: targetDate },
            {
                totalRevenue: stats.totalRevenue,
                totalOrders: stats.totalOrders,
                averageOrderValue,
                newUsers,
                topProducts,
                categorySales,
                abandonedCartsCount: usersWithCart.length,
                potentialCartRevenue
            },
            { upsert: true, new: true }
        );

        res.json(statusReport);

    } catch (error) {
        console.error("Error generando reporte de estado:", error);
        res.status(500).json({ message: "Error generando reporte de inteligencia de negocios" });
    }
};

export const getHistory = async (req, res) => {
    try {
        const history = await Status.find().sort({ date: 1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Error obteniendo historial" });
    }
};
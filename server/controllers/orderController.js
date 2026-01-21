import Order from '../models/Order.js';
import User from '../models/user.js';

export const createOrder = async (req, res) => {
    try {
        const { userId, paymentId, status, total } = req.body;

        const existingOrder = await Order.findOne({ paymentId: String(paymentId) });
        if (existingOrder) {
            return res.status(200).json(existingOrder);
        }

        const user = await User.findById(userId).populate('productosCarrito.product');
        
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (!user.productosCarrito || user.productosCarrito.length === 0) {
            const existing = await Order.findOne({ paymentId: String(paymentId) });
            if (existing) return res.status(200).json(existing);
            return res.status(400).json({ message: "El carrito está vacío y no se encontró orden." });
        }

        const orderItems = user.productosCarrito
            .filter(item => item.product)
            .map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.precioDescuento 
                    ? (item.product.precioOriginal * (1 - item.product.precioDescuento / 100)) 
                    : item.product.precioOriginal
            }));

        const newOrder = new Order({
            user: userId,
            paymentId,
            status,
            total,
            items: orderItems
        });

        try {
            const savedOrder = await newOrder.save();
            res.status(201).json(savedOrder);
        } catch (saveError) {
            if (saveError.code === 11000) {
                const existing = await Order.findOne({ paymentId: String(paymentId) });
                return res.status(200).json(existing);
            }
            throw saveError;
        }
    } catch (error) {
        console.error("Error creando orden:", error);
        res.status(500).json({ message: "Error al crear la orden" });
    }
};

export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'username email provincia localidad telefono')
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Error obteniendo órdenes:", error);
        res.status(500).json({ message: "Error al obtener pedidos" });
    }
};

export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        let updateQuery = { $set: { status } };

        updateQuery.$unset = { expireAt: 1 };

        const updatedOrder = await Order.findByIdAndUpdate(id, updateQuery, { new: true });
        
        if (!updatedOrder) return res.status(404).json({ message: "Pedido no encontrado" });

        res.json(updatedOrder);
    } catch (error) {
        console.error("Error actualizando estado:", error);
        res.status(500).json({ message: "Error al actualizar el estado" });
    }
};

export const getUserOrders = async (req, res) => {
    const { userId } = req.params;
    try {
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).populate('items.product');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener tus pedidos" });
    }
};
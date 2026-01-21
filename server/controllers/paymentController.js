import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import User from '../models/user.js';
import Order from '../models/Order.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export const createPreference = async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId).populate('productosCarrito.product');
        
        if (!user || !user.productosCarrito || user.productosCarrito.length === 0) {
            return res.status(400).json({ message: "El carrito está vacío o el usuario no existe" });
        }

        const items = user.productosCarrito
            .filter(item => item.product)
            .map(item => {
                const product = item.product;
                
                const unitPrice = product.precioDescuento 
                    ? product.precioOriginal * (1 - product.precioDescuento / 100)
                    : product.precioOriginal;

                return {
                    id: String(product._id),
                    title: String(product.nombre),
                    quantity: Number(item.quantity),
                    unit_price: Number(Number(unitPrice).toFixed(2)),
                    currency_id: "ARS",
                    picture_url: product.image ? String(product.image) : undefined
                };
            });

        if (items.length === 0) {
            return res.status(400).json({ message: "El carrito no contiene productos válidos" });
        }

        const clientUrl = req.headers.origin || "http://localhost:5173";

        const body = {
            items,
            payer: {
                name: user.username,
                email: user.email
            },
            back_urls: {
                success: `${clientUrl}/checkout`, 
                failure: `${clientUrl}/checkout`,
                pending: `${clientUrl}/checkout`
            },
            auto_return: "approved",
            binary_mode: true,
            payment_methods: {
                excluded_payment_types: [
                    { id: "ticket" },
                    { id: "atm" }
                ]
            },
            metadata: {
                user_id: userId,
                client_url: clientUrl
            },
            notification_url: process.env.MP_NOTIFICATION_URL,
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        res.json({ id: result.id });

    } catch (error) {
        console.error("Error al crear preferencia de pago:", error);
        res.status(500).json({ message: "Error al procesar el pago", error: error.message });
    }
};

export const receiveWebhook = async (req, res) => {
    const paymentId = req.query.id || (req.body.data && req.body.data.id);
    const topic = req.query.topic || req.body.type;

    try {
        if (topic === 'payment' && paymentId) {
            
            const existingOrder = await Order.findOne({ paymentId: String(paymentId) });
            if (existingOrder) {
                return res.status(200).send("OK");
            }

            const paymentInstance = new Payment(client);
            
            const payment = await paymentInstance.get({ id: paymentId });

            if (payment.status === 'approved') {
                const userId = payment.metadata.user_id;
                const clientUrl = payment.metadata.client_url || "http://localhost:5173";
                
                const logoUrl = "https://res.cloudinary.com/dqskvggfj/image/upload/v1768066684/Logo_j8w70u.png"; 
                
                const user = await User.findById(userId).populate('productosCarrito.product');
                if (!user) return res.status(200).send("OK");

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
                    paymentId: String(paymentId),
                    status: 'approved',
                    total: payment.transaction_amount,
                    items: orderItems
                });

                try {
                    await newOrder.save();

                    try {
                        const itemsHtml = user.productosCarrito
                            .filter(item => item.product)
                            .map(item => {
                                const price = item.product.precioDescuento 
                                    ? (item.product.precioOriginal * (1 - item.product.precioDescuento / 100)) 
                                    : item.product.precioOriginal;
                                return `<li style="margin-bottom: 5px;">${item.product.nombre} (x${item.quantity}) - <b>$${(price * item.quantity).toFixed(2)}</b></li>`;
                            }).join('');

                        await transporter.sendMail({
                            from: process.env.EMAIL_USER,
                            to: user.email,
                            subject: 'Confirmación de Pago - Primordial',
                            html: `
                                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                                        <img src="${logoUrl}" alt="Logo" style="max-height: 40px;" />
                                        <span style="font-weight: 700; font-size: 24px; color: #222;">Product<span style="color: #FFC43F;">Cords</span></span>
                                    </div>
                                    <h2 style="color: #FFC43F;">¡Gracias por tu compra, ${user.username}!</h2>
                                    <p>Tu pago ha sido confirmado exitosamente. Estamos preparando tu pedido.</p>
                                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <h3 style="margin-top: 0;">Detalle del pedido:</h3>
                                        <ul style="padding-left: 20px;">${itemsHtml}</ul>
                                        <p style="font-size: 1.2em; margin-top: 10px;"><strong>Total Pagado: $${payment.transaction_amount.toFixed(2)}</strong></p>
                                    </div>
                                    <p>Puedes seguir el estado de tu compra haciendo clic en el siguiente botón:</p>
                                    <a href="${clientUrl}/my-orders" style="background: #FFC43F; padding: 12px 24px; text-decoration: none; color: white; border-radius: 5px; font-weight: bold; display: inline-block;">Ver mis pedidos</a>
                                    <p style="margin-top: 30px; font-size: 0.9em; color: #777;">Si tienes alguna duda, contáctanos respondiendo a este correo.</p>
                                </div>
                            `
                        });
                    } catch (emailError) {
                        console.error("Error enviando correo de confirmación:", emailError);
                    }

                    user.productosCarrito = [];
                    await user.save();
                    
                } catch (error) {
                    if (error.code === 11000) {
                        return res.status(200).send("OK");
                    }
                    console.error("Error guardando orden en Webhook:", error);
                }
            }
        }
        res.status(200).send("OK");
    } catch (error) {
        console.error("Error en Webhook:", error);
        res.status(200).send("OK");
    }
};

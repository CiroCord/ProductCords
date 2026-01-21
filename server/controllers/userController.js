import User from '../models/user.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;

// --- LISTA DE ADMINISTRADORES ---
const ADMIN_EMAILS = [
    'cirocordara@gmail.com', 
    'guadalojo11@gmail.com',
    'espectador@example.com'
];

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const registerUser = async (req, res) => {
    const { username, email, password, fechaNacimiento, provincia, localidad } = req.body;

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'El email o username ya están en uso.' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            fechaNacimiento,
            provincia,
            localidad
        });

        await newUser.save();

        res.status(201).json({
            message: 'Usuario registrado con éxito.',
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                fechaNacimiento: newUser.fechaNacimiento,
                provincia: newUser.provincia,
                localidad: newUser.localidad,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el usuario.', error: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { credential, password } = req.body;

    try {
        // --- MODO ESPECTADOR: Auto-creación si no existe ---
        if (credential === 'espectador' && password === 'admin26') {
            const existingSpectator = await User.findOne({ username: 'espectador' });
            if (!existingSpectator) {
                const hashedPassword = await bcrypt.hash('admin26', SALT_ROUNDS);
                const spectatorUser = new User({
                    username: 'espectador',
                    email: 'espectador@example.com',
                    password: hashedPassword,
                    fechaNacimiento: new Date(),
                    provincia: 'Modo Espectador',
                    localidad: 'Global'
                });
                await spectatorUser.save();
            }
        }

        const user = await User.findOne({
            $or: [{ email: credential }, { username: credential }]
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, {
            expiresIn: '1h'
        });

        res.json({
            message: 'Inicio de sesión exitoso.',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fechaNacimiento: user.fechaNacimiento,
                provincia: user.provincia,
                localidad: user.localidad,
                isAdmin: ADMIN_EMAILS.includes(user.email),
                isSpectator: user.email === 'espectador@example.com'
            },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión.', error: error.message });
    }
};


export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, password, fechaNacimiento, provincia, localidad, telefono, verificationCode } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // BLOQUEO DE SEGURIDAD: MODO ESPECTADOR
        if (user.email === 'espectador@example.com') {
            return res.status(403).json({ message: 'Modo Espectador: No puedes editar este perfil.' });
        }

        const isSensitiveChange = (email && email !== user.email) || (password && password.trim() !== "");

        if (isSensitiveChange) {
            if (!verificationCode) {
                return res.status(403).json({ message: 'Se requiere código de verificación para cambiar datos sensibles.' });
            }
            if (user.verificationCode !== verificationCode) {
                return res.status(400).json({ message: 'Código de verificación incorrecto o expirado.' });
            }
            user.verificationCode = null;
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (fechaNacimiento) user.fechaNacimiento = fechaNacimiento;
        if (provincia) user.provincia = provincia;
        if (localidad) user.localidad = localidad;
        if (telefono) user.telefono = telefono;

        if (password) {
            user.password = await bcrypt.hash(password, SALT_ROUNDS);
        }

        await user.save();

        res.json({ message: 'Usuario actualizado con éxito.', user });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el usuario.', error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    const { verificationCode } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // BLOQUEO DE SEGURIDAD: MODO ESPECTADOR
        if (user.email === 'espectador@example.com') {
            return res.status(403).json({ message: 'Modo Espectador: No puedes eliminar esta cuenta.' });
        }

        if (!verificationCode) return res.status(403).json({ message: 'Se requiere código de verificación.' });
        
        if (user.verificationCode !== verificationCode) {
            return res.status(400).json({ message: 'Código de verificación incorrecto o expirado.' });
        }

        await User.findByIdAndDelete(id);
        res.json({ message: 'Usuario eliminado con éxito.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario.', error: error.message });
    }
};

export const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await User.find();
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Error al obtener los usuarios:", error);
        res.status(500).json({ message: "Error al obtener los usuarios" });
    }
};

export const obtenerUsuarioxId = async (req, res)=> {
    const { id } = req.params;

    try {
        const user = await User.findById(id).populate('productosCarrito.product');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        
        const userData = user.toObject();
        userData.isAdmin = ADMIN_EMAILS.includes(user.email);
        userData.isSpectator = user.email === 'espectador@example.com';
        
        const hasOrders = await Order.exists({ user: id });
        userData.hasOrders = !!hasOrders;

        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el usuario.', error: error.message });
    }
};

// --- FUNCIONES DEL CARRITO ---

export const addToCart = async (req, res) => {
    const { id } = req.params;
    const { productId, quantity = 1 } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const cartItemIndex = user.productosCarrito.findIndex(item => item.product.toString() === productId);

        if (cartItemIndex > -1) {
            user.productosCarrito[cartItemIndex].quantity += parseInt(quantity);
        } else {
            user.productosCarrito.push({ product: productId, quantity: parseInt(quantity) });
        }

        await user.save();
        res.json({ message: 'Producto agregado al carrito', cart: user.productosCarrito });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar al carrito', error: error.message });
    }
};

export const removeFromCart = async (req, res) => {
    const { id, productId } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        user.productosCarrito = user.productosCarrito.filter(item => item.product.toString() !== productId);
        await user.save();
        res.json({ message: 'Producto eliminado del carrito', cart: user.productosCarrito });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar del carrito', error: error.message });
    }
};

export const updateCartQuantity = async (req, res) => {
    const { id, productId } = req.params;
    const { quantity } = req.body;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const cartItem = user.productosCarrito.find(item => item.product.toString() === productId);
        if (cartItem) {
            cartItem.quantity = parseInt(quantity);
            if (cartItem.quantity <= 0) {
                user.productosCarrito = user.productosCarrito.filter(item => item.product.toString() !== productId);
            }
        }
        await user.save();
        res.json({ message: 'Carrito actualizado', cart: user.productosCarrito });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar carrito', error: error.message });
    }
};

export const clearCart = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        user.productosCarrito = [];
        await user.save();
        res.json({ message: 'Carrito vaciado', cart: user.productosCarrito });
    } catch (error) {
        res.status(500).json({ message: 'Error al vaciar el carrito', error: error.message });
    }
};

// --- FUNCIONES DE FAVORITOS ---

export const getFavorites = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).populate('favorites');
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        
        res.json(user.favorites || []);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener favoritos', error: error.message });
    }
};

export const addFavorite = async (req, res) => {
    const { id } = req.params;
    const { productId } = req.body;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        if (!user.favorites) user.favorites = [];

        if (!user.favorites.includes(productId)) {
            user.favorites.push(productId);
            await user.save();
        }
        res.json({ message: 'Agregado a favoritos', favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar favorito', error: error.message });
    }
};

export const removeFavorite = async (req, res) => {
    const { id, productId } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        if (user.favorites) {
            user.favorites = user.favorites.filter(fav => fav.toString() !== productId);
            await user.save();
        }
        res.json({ message: 'Eliminado de favoritos', favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar favorito', error: error.message });
    }
};

// --- FUNCIONES DE ADMINISTRADOR ---

export const checkAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const isAdmin = ADMIN_EMAILS.includes(user.email);
        res.json({ isAdmin });
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar permisos', error: error.message });
    }
};


export const requestVerificationCode = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.verificationCode = code;
        await user.save();

        const clientUrl = "http://localhost:5173";
        const logoUrl = "https://res.cloudinary.com/dqskvggfj/image/upload/v1768066684/Logo_j8w70u.png";

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email, // Se envía al correo ACTUAL del usuario
            subject: 'Código de Verificación - Primordial',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <img src="${logoUrl}" alt="Logo" style="max-height: 40px;" />
                        <span style="font-weight: 700; font-size: 24px; color: #222;">Product<span style="color: #FFC43F;">Cords</span></span>
                    </div>
                    <h3>Tu código de seguridad es: <b>${code}</b></h3>
                    <p>Úsalo para confirmar tus cambios de perfil.</p>
                </div>
            `
        });

        res.json({ message: "Código enviado a tu correo actual." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al enviar el código." });
    }
};

export const forgotPassword = async (req, res) => {
    
    const { email } = req.body;

        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "No existe un usuario con ese correo." });
            }

            const secret = JWT_SECRET + user.password;
            
            const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '15m' });

            const link = `http://localhost:5173/reset-password/${user._id}/${token}`;
            const clientUrl = "http://localhost:5173";
            const logoUrl = "https://res.cloudinary.com/dqskvggfj/image/upload/v1768066684/Logo_j8w70u.png";

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Restablecer Contraseña - Primordial',
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                            <img src="${logoUrl}" alt="Logo" style="max-height: 40px;" />
                            <span style="font-weight: 700; font-size: 24px; color: #222;">Product<span style="color: #FFC43F;">Cords</span></span>
                        </div>
                        <h2>Recuperación de cuenta</h2>
                        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
                        <a href="${link}" style="background: #FFC43F; padding: 10px 20px; text-decoration: none; color: white; border-radius: 5px;">Restablecer Contraseña</a>
                        <p>Este enlace expira en 15 minutos.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: "Correo enviado. Revisa tu bandeja de entrada." });

        } catch (error) {
            res.status(500).json({ message: "Error al enviar el correo." });
        }
    }

export const resetPassword = async (req, res) => {
        const { id, token } = req.params;
        const { password } = req.body;
        try {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado." });
            }

            const secret = JWT_SECRET + user.password;
            
            try {
                const payload = jwt.verify(token, secret);
                
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
                
                await user.save();
                res.status(200).json({ message: "Contraseña actualizada correctamente." });

            } catch (err) {
                return res.status(400).json({ message: "El enlace es inválido o ha expirado." });
            }

        } catch (error) {
            res.status(500).json({ message: "Error al restablecer la contraseña." });
        }
    }

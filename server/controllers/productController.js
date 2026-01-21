import Product from '../models/Product.js';
import cloudinary from 'cloudinary';
import multer from 'multer';
import path from 'path';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'productos',
        format: async () => 'png',
        public_id: (req, file) => file.originalname,
    },
});

const uploadToCloudinary = async (filePath) => {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload(filePath, (error, result) => {
            if (error) {
                reject(error);
            }
            resolve(result);
        });
    });
};

const defaultProducts = [
    {
        nombre: "Hamburguesa Clásica",
        precioOriginal: 4500,
        precioDescuento: 10,
        tiempo: 20,
        categoria: ["Comida"],
        peso: 350,
        descripcion: "Jugosa hamburguesa de carne vacuna con lechuga, tomate y queso cheddar.",
        image: "https://placehold.co/600x600?text=Hamburguesa",
        compras: 0,
        estrellas: 5
    },
    {
        nombre: "Pizza de Pepperoni",
        precioOriginal: 5800,
        precioDescuento: null,
        tiempo: 30,
        categoria: ["Comida"],
        peso: 800,
        descripcion: "Pizza a la piedra con salsa de tomate, mozzarella y rodajas de pepperoni.",
        image: "https://placehold.co/600x600?text=Pizza",
        compras: 0,
        estrellas: 4
    },
    {
        nombre: "Coca Cola 1.5L",
        precioOriginal: 1800,
        precioDescuento: null,
        tiempo: 5,
        categoria: ["Bebidas"],
        peso: 1500,
        descripcion: "Refresco de cola carbonatado, botella de 1.5 litros.",
        image: "https://placehold.co/600x600?text=Coca+Cola",
        compras: 0,
        estrellas: 5
    },
    {
        nombre: "Tiramisú",
        precioOriginal: 3200,
        precioDescuento: 5,
        tiempo: 15,
        categoria: ["Postre"],
        peso: 250,
        descripcion: "Postre italiano frío, montado en capas de bizcocho humedecido en café y crema mascarpone.",
        image: "https://placehold.co/600x600?text=Tiramisu",
        compras: 0,
        estrellas: 5
    },
    {
        nombre: "Cerveza Artesanal IPA",
        precioOriginal: 2500,
        precioDescuento: null,
        tiempo: 5,
        categoria: ["Bebidas"],
        peso: 500,
        descripcion: "Cerveza India Pale Ale con notas cítricas y amargor moderado.",
        image: "https://placehold.co/600x600?text=Cerveza",
        compras: 0,
        estrellas: 4
    }
];

export const getProducts = async (req, res) => {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany(defaultProducts);
        }
        const products = await Product.find().sort({ _id: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos' });
    }
};

export const createProduct = async (req, res) => {
    const { nombre, precioOriginal, precioDescuento, tiempo, categoria, compras, peso, descripcion } = req.body;
    let imageUrl = '';
    let imageUrls = [];

    if (req.files) {
        try {
            if (req.files.image && req.files.image[0]) {
                const cloudinaryResult = await uploadToCloudinary(req.files.image[0].path);
                imageUrl = cloudinaryResult.secure_url;
            }

            if (req.files.images) {
                for (let file of req.files.images) {
                    const cloudinaryResult = await uploadToCloudinary(file.path);
                    imageUrls.push(cloudinaryResult.secure_url);
                }
            }
        } catch (error) {
            return res.status(500).json({ message: 'Error al subir las imágenes', error: error.message });
        }
    }

    const newProduct = new Product({
        nombre,
        precioOriginal,
        precioDescuento: (precioDescuento === 'null' || precioDescuento === '') ? null : precioDescuento,
        tiempo,
        categoria,
        peso,
        descripcion,
        compras: compras || 0,
        image: imageUrl,
        images: imageUrls,
    });

    try {
        const product = await newProduct.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el producto', error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    if (updatedData.precioDescuento === 'null' || updatedData.precioDescuento === '') {
        updatedData.precioDescuento = null;
    }

    let imageUrl = updatedData.image || '';
    
    let imageUrls = updatedData.images || [];
    if (!Array.isArray(imageUrls)) {
        imageUrls = [imageUrls];
    }

    if (req.files) {
        try {
            if (req.files.image && req.files.image[0]) {
                const cloudinaryResult = await uploadToCloudinary(req.files.image[0].path);
                imageUrl = cloudinaryResult.secure_url;
            }

            if (req.files.images) {
                for (let file of req.files.images) {
                    const cloudinaryResult = await uploadToCloudinary(file.path);
                    imageUrls.push(cloudinaryResult.secure_url);
                }
            }

            const product = await Product.findById(id);
            if (product) {
                if (product.image) {
                    const publicId = product.image.split('/').pop().split('.')[0];
                    cloudinary.v2.uploader.destroy(publicId, (error, result) => {
                        if (error) {
                            console.error('Error al eliminar la imagen principal de Cloudinary:', error);
                        }
                    });
                }

                if (product.images) {
                    for (let image of product.images) {
                        const publicId = image.split('/').pop().split('.')[0];
                        cloudinary.v2.uploader.destroy(publicId, (error, result) => {
                            if (error) {
                                console.error('Error al eliminar la imagen adicional de Cloudinary:', error);
                            }
                        });
                    }
                }
            }
        } catch (error) {
            return res.status(500).json({ message: 'Error al subir las imágenes', error: error.message });
        }
    }

    try {
        const product = await Product.findByIdAndUpdate(
            id,
            { ...updatedData, image: imageUrl, images: imageUrls },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el producto', error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        if (product.image) {
            const publicId = product.image.split('/').pop().split('.')[0];
            cloudinary.v2.uploader.destroy(publicId, (error, result) => {
                if (error) {
                    console.error('Error al eliminar la imagen principal de Cloudinary:', error);
                }
            });
        }

        if (product.images) {
            for (let image of product.images) {
                const publicId = image.split('/').pop().split('.')[0];
                cloudinary.v2.uploader.destroy(publicId, (error, result) => {
                    if (error) {
                        console.error('Error al eliminar la imagen adicional de Cloudinary:', error);
                    }
                });
            }
        }

        res.status(200).json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el producto' });
    }
};

export const getProductById = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
    }
};

export const createDefaultProducts = async (req, res) => {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany(defaultProducts);
            
            if (res) {
                return res.status(201).json({ message: "Productos predeterminados creados" });
            } else {
                console.log("Productos predeterminados creados exitosamente.");
            }
        } else {
            if (res) {
                return res.status(200).json({ message: "Ya existen productos en la base de datos" });
            }
        }
    } catch (error) {
        console.error("Error al crear productos predeterminados:", error);
        if (res) {
            res.status(500).json({ message: "Error al crear productos predeterminados", error: error.message });
        }
    }
};
 
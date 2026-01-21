import Espectacular from '../models/Espectacular.js';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'espectacular',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => 'banner-' + Date.now(),
    }, 
});

export const uploadMiddleware = multer({ storage });

const defaultEspectacularData = {
    sectionStyle: {
        backgroundImage: '',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        layout: 'classic'
    },
    slider: [
        {
            id: 1,
            subtitle: "Especialidad de la Casa",
            categoryClass: "categories my-3",
            title: "Hamburguesa Premium",
            description: "Doble carne, cheddar fundido y panceta crujiente.",
            buttonText: "Pedir Ahora",
            image: "https://betos.com.ar/wp-content/uploads/2019/12/hambur-simple.png",
            link: "/catalogo",
            backgroundColor: "bg-warning-subtle",
            discount: "20% OFF"
        },
        {
            id: 2,
            subtitle: "Sabor Italiano",
            categoryClass: "categories my-3",
            title: "Pizza Napolitana",
            description: "Masa madre, salsa de tomate natural y mozzarella fresca.",
            buttonText: "Ver Menú",
            image: "https://png.pngtree.com/png-clipart/20250117/original/pngtree-a-close-up-high-quality-image-of-perfectly-crafted-neapolitan-pizza-png-image_20275000.png",
            link: "/catalogo",
            backgroundColor: "bg-danger-subtle",
            discount: ""
        }
    ],
    banners: [
        {
            id: 101,
            slides: [
                {
                    id: 1011,
                    subtitle: "Postres",
                    title: "Dulces Tentaciones",
                    buttonText: "Ver Más",
                    image: "/predet-postres.png",
                    link: "/catalogo?category=Postres",
                    backgroundColor: "bg-info-subtle",
                    discount: "NUEVO"
                }
            ]
        },
        { 
            id: 102,
            slides: [
                {
                    id: 1021,
                    subtitle: "Bebidas",
                    title: "Refrescate",
                    buttonText: "Ver Bebidas",
                    image: "/predet-bebidas.png",
                    link: "/catalogo?category=Bebidas",
                    backgroundColor: "bg-success-subtle",
                    discount: ""
                }
            ]
        }
    ]
};

// --- CONTROLADORES ---

export const getEspectacular = async (req, res) => {
    try {
        let config = await Espectacular.findOne();
        
        if (!config) {
            config = new Espectacular(defaultEspectacularData);
            await config.save();
        }
        
        res.json(config);
    } catch (error) {
        console.error("Error obteniendo configuración de espectacular:", error);
        res.status(500).json({ message: "Error al obtener la configuración" });
    }
};

export const updateEspectacular = async (req, res) => {
    try {
        const configData = req.body;

        const updatedConfig = await Espectacular.findOneAndUpdate(
            {},
            configData, 
            { new: true, upsert: true }
        );

        res.json(updatedConfig);
    } catch (error) {
        console.error("Error actualizando espectacular:", error);
        res.status(500).json({ message: "Error al actualizar la configuración" });
    }
};

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se proporcionó ninguna imagen" });
        }

        const imageUrl = req.file.path || req.file.secure_url;

        if (!imageUrl) {
            return res.status(500).json({ message: "La imagen se subió pero no se obtuvo la URL" });
        }

        res.json({ url: imageUrl });
    } catch (error) {
        console.error("Error subiendo imagen:", error);
        res.status(500).json({ message: "Error al subir la imagen" });
    }
};

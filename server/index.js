import 'dotenv/config';
import express from 'express';
import connectDB from './db.js';
import cors from 'cors';
import mongoose from 'mongoose';

import userRoutes from './Routes/userRoutes.js';
import productsRoutes from './Routes/productsRoutes.js';
import configuracionRoutes from './Routes/configuracionRoutes.js';
import paymentRoutes from './Routes/paymentRoutes.js';
import sectionRoutes from './Routes/sectionRoutes.js';
import orderRoutes from './Routes/orderRoutes.js';
import espectacularRoutes from './Routes/espectacularRoutes.js';
import statusRoutes from './Routes/statusRoutes.js';
import { createDefaultSections } from './controllers/sectionController.js';

import { createDefaultConfig } from './controllers/configuracionController.js';


const app = express();
const PORT = process.env.PORT || 5000;


// Configuración de CORS Segura para Producción
const whitelist = [
  process.env.FRONTEND_URL, // Tu dominio de Vercel (configurar en Render)
  'http://localhost:5173',  // Vite Local
  'http://localhost:3000'   // CRA Local (por si acaso)
];

app.use(cors({
  origin: function (origin, callback) {
    // !origin permite peticiones sin origen (como Postman o Server-to-Server)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Conectar base de datos
const mongoURI = process.env.MONGO_URI;

// Verifica si ya hay una conexión activa
if (mongoose.connection.readyState === 0) {
  mongoose.connect(mongoURI)
    .then(() => {
      console.log('Conexión a MongoDB exitosa');
      // Solo crear secciones predeterminadas si la base de datos está vacía
      createDefaultSections();
      createDefaultConfig();
    })
    .catch(err => console.log('Error al conectar a MongoDB:', err));
} else {
  console.log('Conexión ya activa');
}

// Usar rutas
app.use('/api/users', userRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sections', sectionRoutes);
app.use("/api/configuration", configuracionRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/espectacular', espectacularRoutes);
app.use('/api/status', statusRoutes);
// Servidor corriendo
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}/api`);
});
 
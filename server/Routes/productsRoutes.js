import express from 'express';
import multer from 'multer';
import { createProduct, getProducts, updateProduct, getProductById, deleteProduct, createDefaultProducts } from '../controllers/productController.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/default', createDefaultProducts);

router.post('/', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), createProduct);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
 
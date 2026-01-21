import express from 'express';
import { getConfiguration, addCategory, removeCategory, updateCategories } from '../controllers/configuracionController.js';

const router = express.Router();

router.get('/', getConfiguration);

router.post('/category', addCategory);
router.delete('/category', removeCategory);

router.put('/', updateCategories);

export default router;

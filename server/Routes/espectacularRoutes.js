import express from 'express';
import { 
    getEspectacular, 
    updateEspectacular, 
    uploadImage, 
    uploadMiddleware 
} from '../controllers/espectacularController.js';

const router = express.Router();

router.get('/', getEspectacular);

router.put('/', updateEspectacular);

router.post('/upload', uploadMiddleware.single('image'), uploadImage);

export default router;

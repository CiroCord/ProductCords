import express from 'express';
import { generateDailyStatus, getHistory } from '../controllers/statusController.js';

const router = express.Router();

router.post('/generate', generateDailyStatus);
router.get('/', getHistory);

export default router;
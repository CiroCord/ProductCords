import express from 'express';
import { createPreference, receiveWebhook } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create_preference', createPreference);
router.post('/webhook', receiveWebhook);

export default router;

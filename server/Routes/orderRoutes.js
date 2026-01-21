import express from 'express';
import { createOrder, getOrders, updateOrderStatus, getUserOrders } from '../controllers/orderController.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/', getOrders);
router.put('/:id/status', updateOrderStatus);
router.get('/user/:userId', getUserOrders);

export default router;
import express from 'express';
import { registerUser, loginUser, updateUser, deleteUser, obtenerUsuarios, obtenerUsuarioxId, forgotPassword, resetPassword, requestVerificationCode, addToCart, removeFromCart, updateCartQuantity, clearCart, getFavorites, addFavorite, removeFavorite, checkAdmin } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);

router.get('/:id', obtenerUsuarioxId);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password/:id/:token', resetPassword);

router.post('/request-verification/:id', requestVerificationCode);

router.post('/cart/:id', addToCart);
router.delete('/cart/:id/:productId', removeFromCart);
router.put('/cart/:id/:productId', updateCartQuantity);
router.delete('/cart/:id', clearCart);

// Rutas de Favoritos
router.get('/favorites/:id', getFavorites);
router.post('/favorites/:id', addFavorite);
router.delete('/favorites/:id/:productId', removeFavorite);

// Rutas de Admin
router.get('/admin-check/:id', checkAdmin);

router.get('', obtenerUsuarios);
export default router;
 
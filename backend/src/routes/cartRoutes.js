import express from 'express';
const router = express.Router();

import cartController from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

router.get('/', protect, cartController.getCart);
router.post('/add', protect, cartController.addToCart);
router.put('/update', protect, cartController.updateCartItem);
router.delete('/:productId', protect, cartController.removeFromCart);
router.delete('/', protect, cartController.clearCart);

export default  router;

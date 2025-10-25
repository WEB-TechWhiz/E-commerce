import express from 'express';
const router = express.Router();

import productController from '../controllers/productController.js';
import { protect, admin } from '../middleware/auth.js';

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', protect, admin, productController.createProduct);
router.put('/:id', protect, admin, productController.updateProduct);
router.delete('/:id', protect, admin, productController.deleteProduct);
router.post('/:id/reviews', protect, productController.addReview);

export default router;

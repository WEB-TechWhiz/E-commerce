import express from 'express';
const router = express.Router();

import { createCoupon, getCoupons, validateCoupon, applyCoupon, deleteCoupon } from '../controllers/couponController.js';
import { protect, admin } from '../middleware/auth.js';

router.post('/', protect, admin, createCoupon);
router.get('/', protect, admin, getCoupons);
router.post('/validate', protect, validateCoupon);
router.post('/apply', protect, applyCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

export default router;

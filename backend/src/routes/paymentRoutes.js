import express from 'express';
const router = express.Router();

import { createPaymentIntent, confirmPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

export default router;

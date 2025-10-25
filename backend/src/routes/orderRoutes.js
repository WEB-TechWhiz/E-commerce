import express from 'express';
const router = express.Router();

import orderController from '../controllers/orderController.js';
// const { protect, admin } = require('../middleware/auth');
import { protect, admin} from "../middleware/auth.js"

router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getOrders);
router.get('/all', protect, admin, orderController.getAllOrders);
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id/status', protect, admin, orderController.updateOrderStatus);
router.put('/:id/cancel', protect, orderController.cancelOrder);

export default router;

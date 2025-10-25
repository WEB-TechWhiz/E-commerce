import * as paymentService from './paymentService.js';
import Order from '../models/Order.js';

const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { clientSecret, transactionId } = await paymentService.createPaymentIntent(
      order.totalAmount
    );

    order.paymentInfo.transactionId = transactionId;
    await order.save();

    res.json({ clientSecret });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isConfirmed = await paymentService.confirmPayment(paymentIntentId);

    if (isConfirmed) {
      order.paymentInfo.status = 'completed';
      order.orderStatus = 'processing';
      await order.save();

      res.json({ message: 'Payment confirmed', order });
    } else {
      order.paymentInfo.status = 'failed';
      await order.save();

      res.status(400).json({ message: 'Payment failed' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { createPaymentIntent, confirmPayment };

import dotenv from 'dotenv';
dotenv.config();

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


class PaymentService {
  async createPaymentIntent(amount, currency = 'usd') {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        transactionId: paymentIntent.id,
      };
    } catch (err) {
      throw new Error(`Payment failed: ${err.message}`);
    }
  }

  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.status === 'succeeded';
    } catch (err) {
      throw new Error(`Payment confirmation failed: ${err.message}`);
    }
  }

  async refundPayment(paymentIntentId, amount) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(amount * 100),
      });

      return refund;
    } catch (err) {
      throw new Error(`Refund failed: ${err.message}`);
    }
  }
}

export default new PaymentService();

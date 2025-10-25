import mongoose from "mongoose";
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  }],
  totalAmount: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

cartSchema.methods.calculateTotal = function() {
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

export default  mongoose.model('Cart', cartSchema);

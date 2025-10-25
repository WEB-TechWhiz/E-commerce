// const mongoose = require('mongoose');
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discount: { type: Number, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  minPurchase: { type: Number, default: 0 },
  maxDiscount: Number,
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  applicableCategories: [String],
  createdAt: { type: Date, default: Date.now },
});

couponSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

couponSchema.methods.calculateDiscount = function(amount) {
  if (!this.isValid()) return 0;
  
  if (amount < this.minPurchase) return 0;

  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (amount * this.discount) / 100;
    if (this.maxDiscount) {
      discount = Math.min(discount, this.maxDiscount);
    }
  } else {
    discount = this.discount;
  }

  return Math.min(discount, amount);
};

export default  mongoose.model('Coupon', couponSchema);

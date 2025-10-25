 import mongoose from 'mongoose';

const productSimilaritySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  similarProducts: [{
    productId: mongoose.Schema.Types.ObjectId,
    similarityScore: Number,
    similarityType: {
      type: String,
      enum: ['content', 'collaborative', 'hybrid'],
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    category: String,
    tags: [String],
    priceRange: String,
  }
});

productSimilaritySchema.index({ productId: 1 });
productSimilaritySchema.index({ 'similarProducts.productId': 1 });

export default mongoose.model('ProductSimilarity', productSimilaritySchema);
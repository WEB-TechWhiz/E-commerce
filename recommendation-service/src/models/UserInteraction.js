 import mongoose from 'mongoose';

const userInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  interactionType: {
    type: String,
    enum: ['view', 'click', 'add_to_cart', 'purchase', 'wishlist', 'review', 'search'],
    required: true,
    index: true,
  },
  interactionWeight: {
    type: Number,
    default: 1,
  },
  metadata: {
    sessionId: String,
    duration: Number,
    searchQuery: String,
    rating: Number,
    category: String,
    price: Number,
    timestamp: { type: Date, default: Date.now },
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    browser: String,
  },
  context: {
    referrer: String,
    pageUrl: String,
    recommendationSource: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 7776000,
  },
});

userInteractionSchema.index({ userId: 1, productId: 1 });
userInteractionSchema.index({ userId: 1, interactionType: 1, createdAt: -1 });
userInteractionSchema.index({ productId: 1, interactionType: 1, createdAt: -1 });

userInteractionSchema.statics.getUserHistory = async function(userId, limit = 100) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

userInteractionSchema.statics.getPopularProducts = async function(limit = 10, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        interactionType: { $in: ['view', 'purchase', 'add_to_cart'] }
      }
    },
    {
      $group: {
        _id: '$productId',
        totalInteractions: { $sum: '$interactionWeight' },
        viewCount: {
          $sum: { $cond: [{ $eq: ['$interactionType', 'view'] }, 1, 0] }
        },
        purchaseCount: {
          $sum: { $cond: [{ $eq: ['$interactionType', 'purchase'] }, 1, 0] }
        },
        cartCount: {
          $sum: { $cond: [{ $eq: ['$interactionType', 'add_to_cart'] }, 1, 0] }
        }
      }
    },
    { $sort: { totalInteractions: -1 } },
    { $limit: limit }
  ]);
};

export default mongoose.model('UserInteraction', userInteractionSchema);
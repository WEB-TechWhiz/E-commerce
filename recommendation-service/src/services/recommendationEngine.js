 import UserInteraction from '../models/UserInteraction.js';
import ProductSimilarity from '../models/ProductSimilarity.js';
import logger from '../utils/logger.js';
import { getRedisClient } from '../config/redis.js';

class RecommendationEngine {
  constructor() {
    this.interactionWeights = {
      view: 1,
      click: 2,
      add_to_cart: 5,
      wishlist: 3,
      purchase: 10,
      review: 4,
      search: 1.5,
    };
    this.cacheExpiry = 3600; // 1 hour
  }

  async getPersonalizedRecommendations(userId, options = {}) {
    const {
      limit = 10,
      algorithm = 'hybrid',
      excludeProducts = [],
      categoryFilter = null,
    } = options;

    try {
      const cacheKey = `recommendations:${userId}:${algorithm}`;
      const cached = await this.getCachedRecommendations(cacheKey);
      if (cached) {
        logger.info(`Returning cached recommendations for user ${userId}`);
        return this.filterRecommendations(cached, excludeProducts, limit);
      }

      let recommendations = [];

      switch (algorithm) {
        case 'collaborative':
          recommendations = await this.collaborativeFiltering(userId, limit);
          break;
        case 'content':
          recommendations = await this.contentBasedFiltering(userId, limit);
          break;
        case 'hybrid':
          recommendations = await this.hybridRecommendations(userId, limit);
          break;
        default:
          recommendations = await this.hybridRecommendations(userId, limit);
      }

      if (categoryFilter) {
        recommendations = recommendations.filter(r => r.category === categoryFilter);
      }

      await this.cacheRecommendations(cacheKey, recommendations);

      return this.filterRecommendations(recommendations, excludeProducts, limit);
    } catch (error) {
      logger.error('Error generating personalized recommendations:', error);
      return this.getFallbackRecommendations(limit, excludeProducts);
    }
  }

  async collaborativeFiltering(userId, limit = 10) {
    try {
      const userInteractions = await UserInteraction.getUserHistory(userId, 50);

      if (userInteractions.length === 0) {
        return this.getPopularRecommendations(limit);
      }

      const userProductIds = userInteractions.map(i => i.productId);

      const similarUsers = await this.findSimilarUsers(userId, userProductIds);

      const recommendations = await this.getProductsFromSimilarUsers(
        similarUsers,
        userProductIds,
        limit
      );

      return recommendations;
    } catch (error) {
      logger.error('Collaborative filtering error:', error);
      return [];
    }
  }

  async contentBasedFiltering(userId, limit = 10) {
    try {
      const recentInteractions = await UserInteraction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      if (recentInteractions.length === 0) {
        return this.getPopularRecommendations(limit);
      }

      const productScores = {};
      recentInteractions.forEach(interaction => {
        const weight = this.interactionWeights[interaction.interactionType] || 1;
        const productId = interaction.productId.toString();
        productScores[productId] = (productScores[productId] || 0) + weight;
      });

      const topProducts = Object.entries(productScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([productId]) => productId);

      const similarProducts = await this.getSimilarProducts(topProducts, limit);

      return similarProducts;
    } catch (error) {
      logger.error('Content-based filtering error:', error);
      return [];
    }
  }

  async hybridRecommendations(userId, limit = 10) {
    try {
      const [collaborative, contentBased] = await Promise.all([
        this.collaborativeFiltering(userId, Math.ceil(limit * 0.6)),
        this.contentBasedFiltering(userId, Math.ceil(limit * 0.4)),
      ]);

      const combined = [...collaborative, ...contentBased];
      const uniqueProducts = this.deduplicateRecommendations(combined);

      return uniqueProducts.slice(0, limit);
    } catch (error) {
      logger.error('Hybrid recommendations error:', error);
      return this.getFallbackRecommendations(limit);
    }
  }

  async findSimilarUsers(userId, userProductIds) {
    try {
      const similarUsers = await UserInteraction.aggregate([
        {
          $match: {
            productId: { $in: userProductIds },
            userId: { $ne: userId }
          }
        },
        {
          $group: {
            _id: '$userId',
            commonProducts: { $addToSet: '$productId' },
            interactionCount: { $sum: 1 }
          }
        },
        {
          $project: {
            userId: '$_id',
            similarity: {
              $divide: [
                { $size: '$commonProducts' },
                userProductIds.length
              ]
            },
            interactionCount: 1
          }
        },
        { $sort: { similarity: -1, interactionCount: -1 } },
        { $limit: 10 }
      ]);

      return similarUsers;
    } catch (error) {
      logger.error('Error finding similar users:', error);
      return [];
    }
  }

  async getProductsFromSimilarUsers(similarUsers, excludeProducts, limit) {
    try {
      const userIds = similarUsers.map(u => u.userId);

      const recommendations = await UserInteraction.aggregate([
        {
          $match: {
            userId: { $in: userIds },
            productId: { $nin: excludeProducts },
            interactionType: { $in: ['purchase', 'add_to_cart', 'wishlist'] }
          }
        },
        {
          $group: {
            _id: '$productId',
            score: { $sum: '$interactionWeight' },
            interactions: { $sum: 1 }
          }
        },
        { $sort: { score: -1, interactions: -1 } },
        { $limit: limit }
      ]);

      return recommendations.map(r => ({
        productId: r._id,
        score: r.score,
        reason: 'users_also_liked'
      }));
    } catch (error) {
      logger.error('Error getting products from similar users:', error);
      return [];
    }
  }

  async getSimilarProducts(productIds, limit) {
    try {
      const similarities = await ProductSimilarity.find({
        productId: { $in: productIds }
      }).lean();

      const productScores = {};

      similarities.forEach(sim => {
        sim.similarProducts.forEach(sp => {
          const pid = sp.productId.toString();
          if (!productIds.includes(pid)) {
            productScores[pid] = (productScores[pid] || 0) + sp.similarityScore;
          }
        });
      });

      return Object.entries(productScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([productId, score]) => ({
          productId,
          score,
          reason: 'similar_products'
        }));
    } catch (error) {
      logger.error('Error getting similar products:', error);
      return [];
    }
  }

  async getPopularRecommendations(limit = 10, days = 7) {
    try {
      const popular = await UserInteraction.getPopularProducts(limit, days);
      
      return popular.map(p => ({
        productId: p._id,
        score: p.totalInteractions,
        reason: 'trending',
        stats: {
          views: p.viewCount,
          purchases: p.purchaseCount,
          cartAdds: p.cartCount
        }
      }));
    } catch (error) {
      logger.error('Error getting popular recommendations:', error);
      return [];
    }
  }

  async getAlsoBought(productId, limit = 10) {
    try {
      const cacheKey = `also_bought:${productId}`;
      const cached = await this.getCachedRecommendations(cacheKey);
      if (cached) return cached;

      const buyers = await UserInteraction.find({
        productId,
        interactionType: 'purchase'
      }).distinct('userId');

      const alsoBought = await UserInteraction.aggregate([
        {
          $match: {
            userId: { $in: buyers },
            productId: { $ne: productId },
            interactionType: 'purchase'
          }
        },
        {
          $group: {
            _id: '$productId',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      const result = alsoBought.map(item => ({
        productId: item._id,
        score: item.count,
        reason: 'frequently_bought_together'
      }));

      await this.cacheRecommendations(cacheKey, result);
      return result;
    } catch (error) {
      logger.error('Error getting also bought recommendations:', error);
      return [];
    }
  }

  async getSessionBasedRecommendations(sessionProducts, limit = 10) {
    try {
      if (sessionProducts.length === 0) {
        return this.getPopularRecommendations(limit);
      }

      const recommendations = await this.getSimilarProducts(sessionProducts, limit);
      
      return recommendations;
    } catch (error) {
      logger.error('Error getting session-based recommendations:', error);
      return [];
    }
  }

  async trackInteraction(interactionData) {
    try {
      const interaction = new UserInteraction({
        ...interactionData,
        interactionWeight: this.interactionWeights[interactionData.interactionType] || 1,
      });

      await interaction.save();

      await this.invalidateUserCache(interactionData.userId);

      logger.info(`Tracked ${interactionData.interactionType} interaction for user ${interactionData.userId}`);
      
      return interaction;
    } catch (error) {
      logger.error('Error tracking interaction:', error);
      throw error;
    }
  }

  async calculateProductSimilarities(productId, productData) {
    try {
      const { category, tags, price } = productData;

      const similarProducts = await UserInteraction.aggregate([
        {
          $match: {
            'metadata.category': category,
            productId: { $ne: productId }
          }
        },
        {
          $group: {
            _id: '$productId',
            interactions: { $sum: 1 }
          }
        },
        { $sort: { interactions: -1 } },
        { $limit: 20 }
      ]);

      const similarities = similarProducts.map(sp => ({
        productId: sp._id,
        similarityScore: Math.random() * 0.5 + 0.5,
        similarityType: 'content'
      }));

      await ProductSimilarity.findOneAndUpdate(
        { productId },
        {
          productId,
          similarProducts: similarities,
          lastUpdated: new Date(),
          metadata: { category, tags, priceRange: this.getPriceRange(price) }
        },
        { upsert: true, new: true }
      );

      logger.info(`Calculated similarities for product ${productId}`);
    } catch (error) {
      logger.error('Error calculating product similarities:', error);
    }
  }

  getPriceRange(price) {
    if (price < 50) return 'budget';
    if (price < 200) return 'mid';
    if (price < 500) return 'premium';
    return 'luxury';
  }

  deduplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      const id = rec.productId.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  filterRecommendations(recommendations, excludeProducts, limit) {
    const excludeSet = new Set(excludeProducts.map(id => id.toString()));
    return recommendations
      .filter(rec => !excludeSet.has(rec.productId.toString()))
      .slice(0, limit);
  }

  async getCachedRecommendations(key) {
    try {
      const redis = getRedisClient();
      if (!redis) return null;
      
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async cacheRecommendations(key, data) {
    try {
      const redis = getRedisClient();
      if (!redis) return;
      
      await redis.setEx(key, this.cacheExpiry, JSON.stringify(data));
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }

  async invalidateUserCache(userId) {
    try {
      const redis = getRedisClient();
      if (!redis) return;
      
      const keys = await redis.keys(`recommendations:${userId}:*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      logger.error('Redis invalidation error:', error);
    }
  }

  async getFallbackRecommendations(limit, excludeProducts = []) {
    return this.getPopularRecommendations(limit).then(recs => 
      this.filterRecommendations(recs, excludeProducts, limit)
    );
  }
}

export default new RecommendationEngine();
 import recommendationEngine from '../services/recommendationEngine.js';
import logger from '../utils/logger.js';
import UserInteraction from '../models/UserInteraction.js';
import mongoose from 'mongoose';
import { getRedisClient } from '../config/redis.js';

class RecommendationController {
  async getPersonalizedRecommendations(req, res) {
    try {
      const { userId } = req.params;
      const { 
        limit = 10, 
        algorithm = 'hybrid',
        excludeProducts = [],
        categoryFilter 
      } = req.query;

      const recommendations = await recommendationEngine.getPersonalizedRecommendations(
        userId,
        {
          limit: parseInt(limit),
          algorithm,
          excludeProducts: Array.isArray(excludeProducts) ? excludeProducts : [excludeProducts],
          categoryFilter
        }
      );

      res.json({
        success: true,
        count: recommendations.length,
        algorithm,
        recommendations,
      });
    } catch (error) {
      logger.error('Error in getPersonalizedRecommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate recommendations',
        error: error.message,
      });
    }
  }

  async getPopularRecommendations(req, res) {
    try {
      const { limit = 10, days = 7 } = req.query;

      const recommendations = await recommendationEngine.getPopularRecommendations(
        parseInt(limit),
        parseInt(days)
      );

      res.json({
        success: true,
        count: recommendations.length,
        period: `${days} days`,
        recommendations,
      });
    } catch (error) {
      logger.error('Error in getPopularRecommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get popular recommendations',
        error: error.message,
      });
    }
  }

  async getAlsoBought(req, res) {
    try {
      const { productId } = req.params;
      const { limit = 10 } = req.query;

      const recommendations = await recommendationEngine.getAlsoBought(
        productId,
        parseInt(limit)
      );

      res.json({
        success: true,
        productId,
        count: recommendations.length,
        recommendations,
      });
    } catch (error) {
      logger.error('Error in getAlsoBought:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get also bought recommendations',
        error: error.message,
      });
    }
  }

  async getSessionBasedRecommendations(req, res) {
    try {
      const { sessionProducts = [], limit = 10 } = req.body;

      const recommendations = await recommendationEngine.getSessionBasedRecommendations(
        sessionProducts,
        parseInt(limit)
      );

      res.json({
        success: true,
        count: recommendations.length,
        recommendations,
      });
    } catch (error) {
      logger.error('Error in getSessionBasedRecommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get session recommendations',
        error: error.message,
      });
    }
  }

  async getSimilarProducts(req, res) {
    try {
      const { productId } = req.params;
      const { limit = 10 } = req.query;

      const recommendations = await recommendationEngine.getSimilarProducts(
        [productId],
        parseInt(limit)
      );

      res.json({
        success: true,
        productId,
        count: recommendations.length,
        recommendations,
      });
    } catch (error) {
      logger.error('Error in getSimilarProducts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get similar products',
        error: error.message,
      });
    }
  }

  async trackInteraction(req, res) {
    try {
      const {
        userId,
        productId,
        interactionType,
        metadata,
        deviceInfo,
        context,
      } = req.body;

      if (!userId || !productId || !interactionType) {
        return res.status(400).json({
          success: false,
          message: 'userId, productId, and interactionType are required',
        });
      }

      const interaction = await recommendationEngine.trackInteraction({
        userId,
        productId,
        interactionType,
        metadata,
        deviceInfo,
        context,
      });

      res.status(201).json({
        success: true,
        message: 'Interaction tracked successfully',
        interaction,
      });
    } catch (error) {
      logger.error('Error in trackInteraction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track interaction',
        error: error.message,
      });
    }
  }

  async batchTrackInteractions(req, res) {
    try {
      const { interactions } = req.body;

      if (!Array.isArray(interactions) || interactions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'interactions array is required',
        });
      }

      const results = await Promise.allSettled(
        interactions.map(interaction =>
          recommendationEngine.trackInteraction(interaction)
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      res.status(201).json({
        success: true,
        message: 'Batch tracking completed',
        stats: {
          total: interactions.length,
          successful,
          failed,
        },
      });
    } catch (error) {
      logger.error('Error in batchTrackInteractions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to batch track interactions',
        error: error.message,
      });
    }
  }

  async calculateSimilarities(req, res) {
    try {
      const { productId, productData } = req.body;

      if (!productId || !productData) {
        return res.status(400).json({
          success: false,
          message: 'productId and productData are required',
        });
      }

      await recommendationEngine.calculateProductSimilarities(productId, productData);

      res.json({
        success: true,
        message: 'Product similarities calculated successfully',
      });
    } catch (error) {
      logger.error('Error in calculateSimilarities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate similarities',
        error: error.message,
      });
    }
  }

  async getUserHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50, interactionType } = req.query;

      const query = { userId };
      if (interactionType) {
        query.interactionType = interactionType;
      }

      const history = await UserInteraction.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      res.json({
        success: true,
        userId,
        count: history.length,
        history,
      });
    } catch (error) {
      logger.error('Error in getUserHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user history',
        error: error.message,
      });
    }
  }

  async getStats(req, res) {
    try {
      const { days = 7 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const stats = await UserInteraction.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$interactionType',
            count: { $sum: 1 },
          }
        }
      ]);

      const totalInteractions = stats.reduce((sum, stat) => sum + stat.count, 0);
      const uniqueUsers = await UserInteraction.distinct('userId', {
        createdAt: { $gte: startDate }
      });
      const uniqueProducts = await UserInteraction.distinct('productId', {
        createdAt: { $gte: startDate }
      });

      res.json({
        success: true,
        period: `${days} days`,
        stats: {
          totalInteractions,
          uniqueUsers: uniqueUsers.length,
          uniqueProducts: uniqueProducts.length,
          byType: stats,
        },
      });
    } catch (error) {
      logger.error('Error in getStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get stats',
        error: error.message,
      });
    }
  }

  async healthCheck(req, res) {
    try {
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      
      let redisStatus = 'disconnected';
      try {
        const redis = getRedisClient();
        if (redis && redis.isOpen) {
          await redis.ping();
          redisStatus = 'connected';
        }
      } catch (err) {
        redisStatus = 'error';
      }

      const status = dbStatus === 'connected' ? 200 : 503;

      res.status(status).json({
        success: dbStatus === 'connected',
        service: 'recommendation-service',
        timestamp: new Date().toISOString(),
        status: {
          database: dbStatus,
          cache: redisStatus,
        },
      });
    } catch (error) {
      logger.error('Error in healthCheck:', error);
      res.status(503).json({
        success: false,
        message: 'Service unhealthy',
        error: error.message,
      });
    }
  }
}

export default new RecommendationController();

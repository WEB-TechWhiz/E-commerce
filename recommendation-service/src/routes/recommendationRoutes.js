 import express from 'express';
import recommendationController from '../controllers/recommendationController.js';

const router = express.Router();

// Health check
router.get('/health', recommendationController.healthCheck);

// Recommendation endpoints
router.get('/personalized/:userId', recommendationController.getPersonalizedRecommendations);
router.get('/popular', recommendationController.getPopularRecommendations);
router.get('/also-bought/:productId', recommendationController.getAlsoBought);
router.get('/similar/:productId', recommendationController.getSimilarProducts);
router.post('/session', recommendationController.getSessionBasedRecommendations);

// Tracking endpoints
router.post('/track', recommendationController.trackInteraction);
router.post('/track/batch', recommendationController.batchTrackInteractions);

// Admin endpoints
router.post('/calculate-similarities', recommendationController.calculateSimilarities);
router.get('/history/:userId', recommendationController.getUserHistory);
router.get('/stats', recommendationController.getStats);

export default router;

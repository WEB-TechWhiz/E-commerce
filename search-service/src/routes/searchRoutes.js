import express from 'express';
import searchController from '../controllers/searchController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(rateLimiter);

// Validate that all controller methods exist
const validateController = () => {
  const requiredMethods = [
    'search',
    'advancedSearch',
    'semanticSearch',
    'fuzzySearch',
    'autocomplete',
    'suggestions',
    'similarItems',
    'indexDocument',
    'bulkIndex',
    'updateDocument',
    'deleteDocument',
    'getDocument',
    'getAnalytics'
  ];

  requiredMethods.forEach(method => {
    if (typeof searchController[method] !== 'function') {
      throw new Error(`Controller method '${method}' is not defined or not a function`);
    }
  });
};

try {
  validateController();
} catch (error) {
  console.error('Controller validation failed:', error.message);
  console.error('Available methods:', Object.keys(searchController));
}

// Helper to safely create route handlers that check for undefined handlers
const createSafeHandler = (handler, errorMessage) => (req, res, next) => {
  if (typeof handler !== 'function') {
    return res.status(500).json({ error: errorMessage });
  }
  return handler(req, res, next);
};

// Search routes
router.get('/search', createSafeHandler(searchController.search, 'Search endpoint not available'));
router.get('/search/advanced', createSafeHandler(searchController.advancedSearch, 'Advanced search endpoint not available'));
router.get('/search/semantic', createSafeHandler(searchController.semanticSearch, 'Semantic search endpoint not available'));
router.get('/search/fuzzy', createSafeHandler(searchController.fuzzySearch, 'Fuzzy search endpoint not available'));
router.get('/autocomplete', createSafeHandler(searchController.autocomplete, 'Autocomplete endpoint not available'));
router.get('/suggestions', createSafeHandler(searchController.suggestions, 'Suggestions endpoint not available'));
router.get('/analytics', createSafeHandler(searchController.getAnalytics, 'Analytics endpoint not available'));

// Similar items
router.get('/:index/:id/similar', createSafeHandler(searchController.similarItems, 'Similar items endpoint not available'));

// Document management routes
router.post('/:index/document', createSafeHandler(searchController.indexDocument, 'Index document endpoint not available'));
router.post('/:index/bulk', createSafeHandler(searchController.bulkIndex, 'Bulk index endpoint not available'));
router.put('/:index/document/:id', createSafeHandler(searchController.updateDocument, 'Update document endpoint not available'));
router.delete('/:index/document/:id', createSafeHandler(searchController.deleteDocument, 'Delete document endpoint not available'));
router.get('/:index/document/:id', createSafeHandler(searchController.getDocument, 'Get document endpoint not available'));

export default router;

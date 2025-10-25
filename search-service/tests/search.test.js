 const request = require('supertest');
const app = require('../src/app');
const elasticClient = require('../src/services/elasticClient');

describe('Search Service Tests', () => {
  beforeAll(async () => {
    await elasticClient.initialize();
  });

  describe('GET /api/search', () => {
    it('should return 400 when query is missing', async () => {
      const response = await request(app).get('/api/search');
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should search successfully with valid query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'laptop', index: 'products' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'phone', from: 0, size: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body.results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/search/advanced', () => {
    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/search/advanced')
        .query({ q: 'laptop', category: 'electronics' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/search/advanced')
        .query({ q: 'phone', minPrice: 100, maxPrice: 500 });
      
      expect(response.status).toBe(200);
      expect(response.body.results).toBeDefined();
    });
  });

  describe('GET /api/autocomplete', () => {
    it('should return autocomplete suggestions', async () => {
      const response = await request(app)
        .get('/api/autocomplete')
        .query({ q: 'lap' });
      
      expect(response.status).toBe(200);
      expect(response.body.suggestions).toBeDefined();
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });

    it('should return empty suggestions for short query', async () => {
      const response = await request(app)
        .get('/api/autocomplete')
        .query({ q: 'l' });
      
      expect(response.status).toBe(200);
      expect(response.body.suggestions).toEqual([]);
    });
  });

  describe('POST /api/:index/document', () => {
    it('should index a document successfully', async () => {
      const document = {
        id: 'test-product-1',
        name: 'Test Laptop',
        description: 'A test laptop',
        price: 999,
        category: 'electronics',
      };

      const response = await request(app)
        .post('/api/products/document')
        .send(document);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when document ID is missing', async () => {
      const document = {
        name: 'Test Product',
        price: 100,
      };

      const response = await request(app)
        .post('/api/products/document')
        .send(document);
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/:index/:id/similar', () => {
    it('should return similar items', async () => {
      const response = await request(app)
        .get('/api/products/test-product-1/similar')
        .query({ size: 3 });
      
      expect(response.status).toBe(200);
      expect(response.body.similarItems).toBeDefined();
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('search-service');
    });
  });
});
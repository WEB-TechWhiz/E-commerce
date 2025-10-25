 import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import UserInteraction from '../src/models/UserInteraction.js';

describe('Recommendation Service Tests', () => {
  let testUserId;
  let testProductId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/recommendation-test');
    testUserId = new mongoose.Types.ObjectId();
    testProductId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    await UserInteraction.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/recommendations/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('status');
    });
  });

  describe('Track Interaction', () => {
    it('should track a user interaction', async () => {
      const interaction = {
        userId: testUserId,
        productId: testProductId,
        interactionType: 'view',
        metadata: {
          sessionId: 'test-session',
          category: 'electronics',
        },
      };

      const res = await request(app)
        .post('/api/recommendations/track')
        .send(interaction);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.interaction).toHaveProperty('_id');
    });

    it('should fail with invalid interaction type', async () => {
      const interaction = {
        userId: testUserId,
        productId: testProductId,
        interactionType: 'invalid',
      };

      const res = await request(app)
        .post('/api/recommendations/track')
        .send(interaction);

      expect(res.statusCode).toBe(500);
    });
  });

  describe('Get Recommendations', () => {
    it('should get personalized recommendations', async () => {
      const res = await request(app)
        .get(`/api/recommendations/personalized/${testUserId}`)
        .query({ limit: 5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('recommendations');
      expect(Array.isArray(res.body.recommendations)).toBe(true);
    });

    it('should get popular recommendations', async () => {
      const res = await request(app)
        .get('/api/recommendations/popular')
        .query({ limit: 10, days: 7 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.recommendations)).toBe(true);
    });
  });

  describe('Batch Tracking', () => {
    it('should track multiple interactions', async () => {
      const interactions = [
        {
          userId: testUserId,
          productId: testProductId,
          interactionType: 'view',
        },
        {
          userId: testUserId,
          productId: new mongoose.Types.ObjectId(),
          interactionType: 'click',
        },
      ];

      const res = await request(app)
        .post('/api/recommendations/track/batch')
        .send({ interactions });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.successful).toBeGreaterThan(0);
    });
  });

  describe('User History', () => {
    it('should get user interaction history', async () => {
      const res = await request(app)
        .get(`/api/recommendations/history/${testUserId}`)
        .query({ limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.history)).toBe(true);
    });
  });
});

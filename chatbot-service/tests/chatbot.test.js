 const request = require('supertest');
const app = require('../src/app');
const { generateToken } = require('../src/middleware/auth');

describe('Chatbot Service Tests', () => {
  let conversationId;
  let authToken;

  beforeAll(() => {
    authToken = generateToken('test-user-123');
  });

  describe('POST /api/conversations', () => {
    it('should initialize a new conversation', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'customer_support' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.conversationId).toBeDefined();

      conversationId = response.body.conversationId;
    });

    it('should allow anonymous conversation', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({ type: 'default' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/chat', () => {
    it('should return 400 without message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ conversationId });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 without conversationId', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' });

      expect(response.status).toBe(400);
    });

    it('should send message and get response', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          conversationId,
          message: 'Hello, how can you help me?',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.intent).toBeDefined();
      expect(response.body.usage).toBeDefined();
    }, 30000); // 30 second timeout for OpenAI
  });

  describe('GET /api/conversations/:conversationId', () => {
    it('should get conversation history', async () => {
      const response = await request(app)
        .get(`/api/conversations/${conversationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.conversation).toBeDefined();
      expect(response.body.conversation.messages).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await request(app)
        .get('/api/conversations/invalid-id');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/conversations/:conversationId/summary', () => {
    it('should get conversation summary', async () => {
      const response = await request(app)
        .get(`/api/conversations/${conversationId}/summary`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.messageCount).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/conversations/:conversationId/context', () => {
    it('should update conversation context', async () => {
      const response = await request(app)
        .put(`/api/conversations/${conversationId}/context`)
        .send({
          context: {
            userId: 'test-123',
            preferences: { language: 'en' },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.context).toBeDefined();
    });
  });

  describe('POST /api/moderate', () => {
    it('should moderate content', async () => {
      const response = await request(app)
        .post('/api/moderate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'This is a test message' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.moderation).toBeDefined();
      expect(response.body.moderation.flagged).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/moderate')
        .send({ text: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/conversations/:conversationId/clear', () => {
    it('should clear conversation history', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/clear`)
        .send({ keepLast: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/conversations/:conversationId', () => {
    it('should delete conversation', async () => {
      const response = await request(app)
        .delete(`/api/conversations/${conversationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('chatbot-service');
    });
  });
});
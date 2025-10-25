import express from 'express';
import chatController from '../controllers/chatController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { validateMessage } from '../middleware/validation.js';

const router = express.Router();

router.use(rateLimiter);

router.post('/conversations', optionalAuth, chatController.initConversation);
router.get('/conversations', requireAuth, chatController.getUserConversations);
router.get('/conversations/:conversationId', optionalAuth, chatController.getHistory);
router.delete('/conversations/:conversationId', optionalAuth, chatController.deleteConversation);
router.post('/conversations/:conversationId/clear', optionalAuth, chatController.clearHistory);
router.get('/conversations/:conversationId/summary', optionalAuth, chatController.getConversationSummary);
router.put('/conversations/:conversationId/context', optionalAuth, chatController.updateContext);

router.post('/chat', validateMessage, optionalAuth, chatController.sendMessage);
router.post('/chat/stream', validateMessage, optionalAuth, chatController.streamMessage);

router.post('/embedding', requireAuth, chatController.generateEmbedding);
router.post('/moderate', requireAuth, chatController.moderateContent);

export default router;

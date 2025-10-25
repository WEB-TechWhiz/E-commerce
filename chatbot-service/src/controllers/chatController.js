import openAIClient from '../services/openAIClient.js';
import dialogManager from '../services/dialogManager.js';
import logger from '../utils/logger.js';

class ChatController {
  async initConversation(req, res) {
    try {
      const { type = 'default', metadata = {} } = req.body;
      const userId = req.user?.id || 'anonymous';

      const conversationId = await dialogManager.initConversation(userId, type, metadata);

      res.status(201).json({
        success: true,
        conversationId,
        message: 'Conversation initialized',
      });
    } catch (error) {
      logger.error('Init conversation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize conversation',
      });
    }
  }

  async sendMessage(req, res) {
    try {
      const { conversationId, message } = req.body;

      if (!conversationId || !message) {
        return res.status(400).json({
          success: false,
          error: 'conversationId and message are required',
        });
      }

      const conversation = await dialogManager.getConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
      }

      if (req.user && conversation.userId !== req.user.id && conversation.userId !== 'anonymous') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to conversation',
        });
      }

      const moderation = await openAIClient.moderateContent(message);

      if (moderation.flagged) {
        return res.status(400).json({
          success: false,
          error: 'Message contains inappropriate content',
          categories: moderation.categories,
        });
      }

      await dialogManager.addMessage(conversationId, 'user', message);

      const intent = dialogManager.detectIntent(message);
      const entities = dialogManager.extractEntities(message);

      await dialogManager.updateContext(conversationId, {
        lastIntent: intent,
        lastEntities: entities,
      });

      const messages = dialogManager.buildMessages(conversation);

      const response = await openAIClient.chat(messages, {
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      });

      await dialogManager.addMessage(conversationId, 'assistant', response.content, {
        intent,
        entities,
        usage: response.usage,
      });

      res.json({
        success: true,
        response: response.content,
        intent,
        entities,
        usage: response.usage,
      });
    } catch (error) {
      logger.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process message',
      });
    }
  }

  async streamMessage(req, res) {
    try {
      const { conversationId, message } = req.body;

      if (!conversationId || !message) {
        return res.status(400).json({
          success: false,
          error: 'conversationId and message are required',
        });
      }

      const conversation = await dialogManager.getConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
      }

      const moderation = await openAIClient.moderateContent(message);

      if (moderation.flagged) {
        return res.status(400).json({
          success: false,
          error: 'Message contains inappropriate content',
        });
      }

      await dialogManager.addMessage(conversationId, 'user', message);

      const messages = dialogManager.buildMessages(conversation);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';

      await openAIClient.streamChat(messages, {}, (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      });

      await dialogManager.addMessage(conversationId, 'assistant', fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      logger.error('Stream message error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stream message',
      });
    }
  }

  async getHistory(req, res) {
    try {
      const { conversationId } = req.params;

      const conversation = await dialogManager.getConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
      }

      if (req.user && conversation.userId !== req.user.id && conversation.userId !== 'anonymous') {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      res.json({
        success: true,
        conversation: {
          id: conversation.id,
          type: conversation.type,
          messages: conversation.messages,
          context: conversation.context,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Get history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversation history',
      });
    }
  }

  async clearHistory(req, res) {
    try {
      const { conversationId } = req.params;
      const { keepLast = 0 } = req.body;

      const conversation = await dialogManager.clearHistory(conversationId, keepLast);

      res.json({
        success: true,
        message: 'Conversation history cleared',
        messagesRemaining: conversation.messages.length,
      });
    } catch (error) {
      logger.error('Clear history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear history',
      });
    }
  }

  async deleteConversation(req, res) {
    try {
      const { conversationId } = req.params;

      await dialogManager.deleteConversation(conversationId);

      res.json({
        success: true,
        message: 'Conversation deleted',
      });
    } catch (error) {
      logger.error('Delete conversation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete conversation',
      });
    }
  }

  async getUserConversations(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      const conversations = await dialogManager.getUserConversations(userId);

      res.json({
        success: true,
        conversations: conversations.map(conv => ({
          id: conv.id,
          type: conv.type,
          messageCount: conv.messages.length,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        })),
      });
    } catch (error) {
      logger.error('Get user conversations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversations',
      });
    }
  }

  async getConversationSummary(req, res) {
    try {
      const { conversationId } = req.params;

      const summary = await dialogManager.getConversationSummary(conversationId);

      res.json({
        success: true,
        summary,
      });
    } catch (error) {
      logger.error('Get summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversation summary',
      });
    }
  }

  async updateContext(req, res) {
    try {
      const { conversationId } = req.params;
      const { context } = req.body;

      if (!context) {
        return res.status(400).json({
          success: false,
          error: 'Context is required',
        });
      }

      const updatedContext = await dialogManager.updateContext(conversationId, context);

      res.json({
        success: true,
        context: updatedContext,
      });
    } catch (error) {
      logger.error('Update context error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update context',
      });
    }
  }
}

export default new ChatController();

 import logger from '../utils/logger.js';
import ConversationStore from '../utils/conversationStore.js';

class DialogManager {
  constructor() {
    this.conversationStore = new ConversationStore();
    
    this.systemPrompts = {
      default: 'You are a helpful assistant. Provide clear, concise, and accurate responses.',
      customer_support: 'You are a customer support assistant. Be empathetic, professional, and help resolve customer issues.',
      sales: 'You are a sales assistant. Help customers find products, answer questions, and guide them through the purchase process.',
      technical: 'You are a technical support assistant. Provide detailed technical solutions and troubleshooting steps.',
      ecommerce: `You are an e-commerce assistant. Help customers:
- Find products based on their needs
- Answer product questions
- Track orders
- Handle returns and refunds
- Provide recommendations
Be friendly, helpful, and guide customers to complete their purchases.`,
    };

    this.intents = {
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
      farewell: ['bye', 'goodbye', 'see you', 'take care'],
      help: ['help', 'support', 'assist', 'need help'],
      product_search: ['find', 'search', 'looking for', 'show me', 'need'],
      order_status: ['order', 'track', 'status', 'where is my'],
      complaint: ['complaint', 'issue', 'problem', 'not working', 'broken'],
      recommendation: ['recommend', 'suggest', 'what should', 'best'],
    };

    this.contextWindow = 10; // Keep last 10 messages
  }

  async initConversation(userId, type = 'default', metadata = {}) {
    const conversationId = this.generateConversationId();

    const conversation = {
      id: conversationId,
      userId,
      type,
      metadata,
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.conversationStore.save(conversationId, conversation);

    logger.info('Conversation initialized', { conversationId, userId, type });

    return conversationId;
  }

  async getConversation(conversationId) {
    return await this.conversationStore.get(conversationId);
  }

  async addMessage(conversationId, role, content, metadata = {}) {
    const conversation = await this.getConversation(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const message = {
      role,
      content,
      metadata,
      timestamp: new Date(),
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    if (conversation.messages.length > this.contextWindow) {
      conversation.messages = conversation.messages.slice(-this.contextWindow);
    }

    await this.conversationStore.save(conversationId, conversation);

    return message;
  }

  buildMessages(conversation, includeSystem = true) {
    const messages = [];

    if (includeSystem) {
      const systemPrompt = this.systemPrompts[conversation.type] || this.systemPrompts.default;
      messages.push({ role: 'system', content: systemPrompt });

      if (conversation.context && Object.keys(conversation.context).length > 0) {
        messages.push({ role: 'system', content: `Context: ${JSON.stringify(conversation.context)}` });
      }
    }

    conversation.messages.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });

    return messages;
  }

  detectIntent(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    for (const [intent, keywords] of Object.entries(this.intents)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }

  extractEntities(message) {
    const entities = { numbers: [], emails: [], urls: [], dates: [] };

    const numbers = message.match(/\b\d+\b/g);
    if (numbers) entities.numbers = numbers;

    const emails = message.match(/[\w.-]+@[\w.-]+\.\w+/g);
    if (emails) entities.emails = emails;

    const urls = message.match(/https?:\/\/[^\s]+/g);
    if (urls) entities.urls = urls;

    const dates = message.match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/g);
    if (dates) entities.dates = dates;

    return entities;
  }

  async updateContext(conversationId, contextUpdates) {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    conversation.context = { ...conversation.context, ...contextUpdates };
    conversation.updatedAt = new Date();

    await this.conversationStore.save(conversationId, conversation);

    return conversation.context;
  }

  async getConversationSummary(conversationId) {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const messageCount = conversation.messages.length;
    const userMessages = conversation.messages.filter(m => m.role === 'user').length;
    const assistantMessages = conversation.messages.filter(m => m.role === 'assistant').length;
    const duration = new Date() - new Date(conversation.createdAt);
    const durationMinutes = Math.floor(duration / 1000 / 60);

    return {
      conversationId: conversation.id,
      type: conversation.type,
      messageCount,
      userMessages,
      assistantMessages,
      duration: durationMinutes,
      lastActivity: conversation.updatedAt,
      context: conversation.context,
    };
  }

  async clearHistory(conversationId, keepLast = 0) {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    if (keepLast > 0) {
      conversation.messages = conversation.messages.slice(-keepLast);
    } else {
      conversation.messages = [];
    }
    conversation.updatedAt = new Date();

    await this.conversationStore.save(conversationId, conversation);
    return conversation;
  }

  async deleteConversation(conversationId) {
    await this.conversationStore.delete(conversationId);
    logger.info('Conversation deleted', { conversationId });
  }

  async getUserConversations(userId) {
    return await this.conversationStore.getByUserId(userId);
  }

  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async handleFunctionCall(functionCall, conversation) {
    const { name, arguments: args } = functionCall;

    try {
      const parsedArgs = JSON.parse(args);

      switch (name) {
        case 'search_products':
          return await this.searchProducts(parsedArgs, conversation);
        case 'get_order_status':
          return await this.getOrderStatus(parsedArgs, conversation);
        case 'create_ticket':
          return await this.createTicket(parsedArgs, conversation);
        default:
          return { error: 'Unknown function' };
      }
    } catch (error) {
      logger.error('Function call handling error:', error);
      return { error: error.message };
    }
  }

  async searchProducts(params, conversation) {
    logger.info('Searching products', params);
    return {
      products: [{ id: 1, name: 'Sample Product', price: 99.99 }],
      message: 'Found products based on your criteria',
    };
  }

  async getOrderStatus(params, conversation) {
    logger.info('Getting order status', params);
    return {
      orderId: params.orderId,
      status: 'shipped',
      estimatedDelivery: '2024-01-15',
      message: 'Your order is on the way',
    };
  }

  async createTicket(params, conversation) {
    logger.info('Creating support ticket', params);
    return {
      ticketId: 'TICKET-12345',
      message: 'Support ticket created successfully',
    };
  }
}

export default new DialogManager();

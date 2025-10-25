class ConversationStore {
  constructor() {
    // In-memory store for development
    // In production, use Redis, MongoDB, or similar
    this.store = new Map();
    this.userIndex = new Map(); // userId -> [conversationIds]
  }

  async save(conversationId, conversation) {
    this.store.set(conversationId, conversation);
    
    // Update user index
    const userId = conversation.userId;
    if (!this.userIndex.has(userId)) {
      this.userIndex.set(userId, []);
    }
    
    const userConvs = this.userIndex.get(userId);
    if (!userConvs.includes(conversationId)) {
      userConvs.push(conversationId);
    }
    
    return conversation;
  }

  async get(conversationId) {
    return this.store.get(conversationId);
  }

  async delete(conversationId) {
    const conversation = this.store.get(conversationId);
    
    if (conversation) {
      // Remove from user index
      const userConvs = this.userIndex.get(conversation.userId);
      if (userConvs) {
        const index = userConvs.indexOf(conversationId);
        if (index > -1) {
          userConvs.splice(index, 1);
        }
      }
    }
    
    return this.store.delete(conversationId);
  }

  async getByUserId(userId) {
    const conversationIds = this.userIndex.get(userId) || [];
    return conversationIds.map(id => this.store.get(id)).filter(Boolean);
  }

  async clear() {
    this.store.clear();
    this.userIndex.clear();
  }
}

export default ConversationStore;

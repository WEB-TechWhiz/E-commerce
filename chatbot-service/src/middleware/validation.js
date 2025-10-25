const validateMessage = (req, res, next) => {
  const { message, conversationId } = req.body;

  const errors = [];

  if (!message) {
    errors.push('Message is required');
  } else if (typeof message !== 'string') {
    errors.push('Message must be a string');
  } else if (message.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (message.length > 4000) {
    errors.push('Message is too long (max 4000 characters)');
  }

  if (!conversationId) {
    errors.push('Conversation ID is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
};

const validateConversationInit = (req, res, next) => {
  const { type } = req.body;

  const validTypes = ['default', 'customer_support', 'sales', 'technical', 'ecommerce'];

  if (type && !validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid conversation type. Must be one of: ${validTypes.join(', ')}`,
    });
  }

  next();
};

export { validateMessage, validateConversationInit };

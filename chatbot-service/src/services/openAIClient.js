import OpenAI from 'openai';
import logger from '../utils/logger.js';

class OpenAIClient {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.models = {
      gpt4: 'gpt-4-turbo-preview',
      gpt35: 'gpt-3.5-turbo',
      embedding: 'text-embedding-3-small',
    };

    this.defaultConfig = {
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };
  }

  async chat(messages, options = {}) {
    try {
      const config = {
        model: options.model || this.models.gpt35,
        messages,
        temperature: options.temperature ?? this.defaultConfig.temperature,
        max_tokens: options.max_tokens || this.defaultConfig.max_tokens,
        top_p: options.top_p ?? this.defaultConfig.top_p,
        frequency_penalty: options.frequency_penalty ?? this.defaultConfig.frequency_penalty,
        presence_penalty: options.presence_penalty ?? this.defaultConfig.presence_penalty,
        stream: options.stream || false,
      };

      if (options.functions) {
        config.functions = options.functions;
        config.function_call = options.function_call || 'auto';
      }

      const response = await this.client.chat.completions.create(config);

      logger.info('OpenAI chat completion', {
        model: config.model,
        tokens: response.usage,
      });

      return {
        content: response.choices[0].message.content,
        role: response.choices[0].message.role,
        functionCall: response.choices[0].message.function_call,
        finishReason: response.choices[0].finish_reason,
        usage: response.usage,
      };
    } catch (error) {
      logger.error('OpenAI chat error:', error);
      throw this.handleError(error);
    }
  }

  async streamChat(messages, options = {}, onChunk) {
    try {
      const config = {
        model: options.model || this.models.gpt35,
        messages,
        temperature: options.temperature ?? this.defaultConfig.temperature,
        max_tokens: options.max_tokens || this.defaultConfig.max_tokens,
        stream: true,
      };

      const stream = await this.client.chat.completions.create(config);

      let fullContent = '';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          fullContent += delta.content;
          onChunk(delta.content);
        }

        if (chunk.choices[0]?.finish_reason) {
          break;
        }
      }

      return fullContent;
    } catch (error) {
      logger.error('OpenAI stream error:', error);
      throw this.handleError(error);
    }
  }

  async createEmbedding(text) {
    try {
      const response = await this.client.embeddings.create({
        model: this.models.embedding,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('OpenAI embedding error:', error);
      throw this.handleError(error);
    }
  }

  async moderateContent(text) {
    try {
      const response = await this.client.moderations.create({
        input: text,
      });

      const result = response.results[0];

      return {
        flagged: result.flagged,
        categories: result.categories,
        categoryScores: result.category_scores,
      };
    } catch (error) {
      logger.error('OpenAI moderation error:', error);
      throw this.handleError(error);
    }
  }

  async generateFunctionCall(messages, functions) {
    try {
      const response = await this.chat(messages, {
        functions,
        function_call: 'auto',
      });

      return response.functionCall;
    } catch (error) {
      logger.error('Function call error:', error);
      throw error;
    }
  }

  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.message;

      switch (status) {
        case 401:
          return new Error('Invalid OpenAI API key');
        case 429:
          return new Error('Rate limit exceeded. Please try again later');
        case 500:
          return new Error('OpenAI service error. Please try again');
        default:
          return new Error(message);
      }
    }

    return error;
  }

  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  validateMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new Error('Each message must have role and content');
      }
      if (!['system', 'user', 'assistant', 'function'].includes(msg.role)) {
        throw new Error('Invalid message role');
      }
    }
    return true;
  }
}

export default new OpenAIClient();

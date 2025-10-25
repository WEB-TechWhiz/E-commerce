import { Client } from '@elastic/elasticsearch';

export const elasticsearchConfig = {
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  },
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true,
};

export const indexConfigs = {
  products: {
    settings: {
      number_of_shards: 2,
      number_of_replicas: 1,
      analysis: {
        analyzer: {
          custom_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'asciifolding', 'synonym_filter', 'stop', 'snowball'],
          },
          autocomplete_analyzer: {
            type: 'custom',
            tokenizer: 'autocomplete_tokenizer',
            filter: ['lowercase', 'asciifolding'],
          },
          search_autocomplete_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'asciifolding'],
          },
        },
        tokenizer: {
          autocomplete_tokenizer: {
            type: 'edge_ngram',
            min_gram: 2,
            max_gram: 20,
            token_chars: ['letter', 'digit'],
          },
        },
        filter: {
          synonym_filter: {
            type: 'synonym',
            synonyms: [
              'phone, mobile, smartphone',
              'laptop, notebook, computer',
              'tv, television',
              'fridge, refrigerator',
            ],
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'custom_analyzer',
          fields: {
            keyword: { type: 'keyword' },
            autocomplete: {
              type: 'text',
              analyzer: 'autocomplete_analyzer',
              search_analyzer: 'search_autocomplete_analyzer',
            },
          },
        },
        description: {
          type: 'text',
          analyzer: 'custom_analyzer',
        },
        category: {
          type: 'keyword',
          fields: {
            text: { type: 'text', analyzer: 'custom_analyzer' },
          },
        },
        brand: { type: 'keyword' },
        price: { type: 'float' },
        rating: { type: 'float' },
        reviewCount: { type: 'integer' },
        stock: { type: 'integer' },
        tags: { type: 'keyword' },
        attributes: { type: 'object', enabled: false },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        popularity: { type: 'float' },
        sales: { type: 'integer' },
        isActive: { type: 'boolean' },
      },
    },
  },
  users: {
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1,
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: { type: 'text', analyzer: 'standard' },
        email: { type: 'keyword' },
        searchHistory: { type: 'text' },
        preferences: { type: 'object' },
        createdAt: { type: 'date' },
      },
    },
  },
  orders: {
    settings: {
      number_of_shards: 2,
      number_of_replicas: 1,
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        userId: { type: 'keyword' },
        items: { type: 'nested' },
        totalAmount: { type: 'float' },
        status: { type: 'keyword' },
        createdAt: { type: 'date' },
      },
    },
  },
};

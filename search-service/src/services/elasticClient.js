import { Client } from '@elastic/elasticsearch';
import { elasticsearchConfig, indexConfigs } from '../config/elasticsearch.js';
import logger from '../utils/logger.js';

class ElasticsearchService {
  constructor() {
    this.client = new Client(elasticsearchConfig);
    this.initialized = false;
  }

  async initialize() {
    try {
      await this.client.ping();
      logger.info('Elasticsearch connection established');
      await this.initializeIndices();
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('Elasticsearch initialization failed:', error);
      throw error;
    }
  }

  async initializeIndices() {
    for (const [indexName, config] of Object.entries(indexConfigs)) {
      try {
        const exists = await this.client.indices.exists({ index: indexName });
        if (!exists) {
          await this.client.indices.create({ index: indexName, body: config });
          logger.info(`Index '${indexName}' created successfully`);
        } else {
          logger.info(`Index '${indexName}' already exists`);
        }
      } catch (error) {
        logger.error(`Error initializing index '${indexName}':`, error);
      }
    }
  }

  async indexDocument(index, id, document) {
    try {
      const response = await this.client.index({
        index,
        id,
        body: document,
        refresh: 'wait_for',
      });
      logger.info(`Document indexed: ${index}/${id}`);
      return response;
    } catch (error) {
      logger.error(`Error indexing document: ${index}/${id}`, error);
      throw error;
    }
  }

  async bulkIndex(index, documents) {
    try {
      const body = documents.flatMap(doc => [{ index: { _index: index, _id: doc.id } }, doc]);
      const response = await this.client.bulk({ refresh: 'wait_for', body });

      if (response.errors) {
        const erroredDocuments = [];
        response.items.forEach((action, i) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              status: action[operation].status,
              error: action[operation].error,
              document: documents[i],
            });
          }
        });
        logger.warn('Bulk indexing had errors:', erroredDocuments);
      }

      logger.info(`Bulk indexed ${documents.length} documents to ${index}`);
      return response;
    } catch (error) {
      logger.error('Bulk indexing error:', error);
      throw error;
    }
  }

  async updateDocument(index, id, updates) {
    try {
      const response = await this.client.update({
        index,
        id,
        body: { doc: updates },
        refresh: 'wait_for',
      });
      logger.info(`Document updated: ${index}/${id}`);
      return response;
    } catch (error) {
      logger.error(`Error updating document: ${index}/${id}`, error);
      throw error;
    }
  }

  async deleteDocument(index, id) {
    try {
      const response = await this.client.delete({
        index,
        id,
        refresh: 'wait_for',
      });
      logger.info(`Document deleted: ${index}/${id}`);
      return response;
    } catch (error) {
      logger.error(`Error deleting document: ${index}/${id}`, error);
      throw error;
    }
  }

  async search(index, query, options = {}) {
    try {
      const { from = 0, size = 10, sort = [], filters = [], aggregations = {} } = options;

      const response = await this.client.search({
        index,
        body: { query, from, size, sort, aggs: aggregations },
      });

      return this.formatSearchResponse(response);
    } catch (error) {
      logger.error('Search error:', error);
      throw error;
    }
  }

  async multiMatchSearch(index, searchTerm, fields, options = {}) {
    const query = {
      bool: {
        must: [
          {
            multi_match: {
              query: searchTerm,
              fields,
              type: 'best_fields',
              operator: 'or',
              fuzziness: 'AUTO',
              prefix_length: 2,
            },
          },
        ],
        filter: options.filters || [],
      },
    };

    return this.search(index, query, options);
  }

  async autocomplete(index, field, prefix, size = 10) {
    try {
      const query = {
        match: {
          [`${field}.autocomplete`]: { query: prefix, operator: 'and' },
        },
      };

      return await this.search(index, query, { size });
    } catch (error) {
      logger.error('Autocomplete error:', error);
      throw error;
    }
  }

  async fuzzySearch(index, field, value, options = {}) {
    const query = {
      fuzzy: {
        [field]: {
          value,
          fuzziness: options.fuzziness || 'AUTO',
          prefix_length: options.prefixLength || 2,
          max_expansions: options.maxExpansions || 50,
        },
      },
    };

    return this.search(index, query, options);
  }

  async advancedSearch(index, searchParams) {
    const { query, filters = {}, sort = [], from = 0, size = 10, aggregations = {} } = searchParams;

    const filterClauses = [];

    Object.entries(filters).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        filterClauses.push({ terms: { [field]: value } });
      } else if (typeof value === 'object' && (value.gte || value.lte)) {
        filterClauses.push({ range: { [field]: value } });
      } else {
        filterClauses.push({ term: { [field]: value } });
      }
    });

    const searchQuery = {
      bool: {
        must: query ? [query] : [{ match_all: {} }],
        filter: filterClauses,
      },
    };

    return this.search(index, searchQuery, { from, size, sort, aggregations });
  }

  async getSuggestions(index, field, text) {
    try {
      const response = await this.client.search({
        index,
        body: {
          suggest: {
            text,
            simple_phrase: {
              phrase: {
                field,
                size: 5,
                gram_size: 3,
                direct_generator: [{ field, suggest_mode: 'always', min_word_length: 3 }],
              },
            },
          },
        },
      });
      return response.suggest.simple_phrase[0].options.map(opt => ({
        text: opt.text,
        score: opt.score,
      }));
    } catch (error) {
      logger.error('Suggestions error:', error);
      throw error;
    }
  }

  async getById(index, id) {
    try {
      const response = await this.client.get({ index, id });
      return response._source;
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      logger.error(`Error getting document: ${index}/${id}`, error);
      throw error;
    }
  }

  formatSearchResponse(response) {
    return {
      total: response.hits.total.value,
      hits: response.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
      })),
      aggregations: response.aggregations,
      took: response.took,
    };
  }

  async refreshIndex(index) {
    try {
      await this.client.indices.refresh({ index });
      logger.info(`Index refreshed: ${index}`);
    } catch (error) {
      logger.error(`Error refreshing index: ${index}`, error);
      throw error;
    }
  }

  async getIndexStats(index) {
    try {
      const response = await this.client.indices.stats({ index });
      return response;
    } catch (error) {
      logger.error(`Error getting index stats: ${index}`, error);
      throw error;
    }
  }

  async deleteIndex(index) {
    try {
      await this.client.indices.delete({ index });
      logger.info(`Index deleted: ${index}`);
    } catch (error) {
      logger.error(`Error deleting index: ${index}`, error);
      throw error;
    }
  }
}

export default new ElasticsearchService();

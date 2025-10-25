 # Advanced Search Service

A production-ready search service built with Node.js, Elasticsearch, and Natural Language Processing.

## 🚀 Features

### Core Search Capabilities
- **Full-Text Search** - Advanced text search with relevance scoring
- **Fuzzy Search** - Typo-tolerant search with automatic corrections
- **Autocomplete** - Real-time search suggestions
- **Semantic Search** - NLP-enhanced search with query expansion
- **Faceted Search** - Multi-dimensional filtering with aggregations
- **Similar Items** - "More Like This" recommendations
- **Multi-language Support** - Built-in analyzers for multiple languages

### NLP Features
- Query tokenization and stemming
- Stop words removal
- Intent detection
- Named entity extraction
- Keyword extraction using TF-IDF
- Synonym expansion
- Spell correction
- Sentiment analysis
- Price range extraction from natural language

### Advanced Features
- Boosted fields for relevance tuning
- Custom analyzers with edge n-grams
- Synonym filters
- Price range aggregations
- Rating-based filtering
- Stock availability filtering
- Search analytics and logging
- Rate limiting

## 📁 Project Structure

```
search-service/
├── src/
│   ├── config/
│   │   └── elasticsearch.js      # ES configuration & index mappings
│   ├── controllers/
│   │   └── searchController.js   # Request handlers
│   ├── services/
│   │   ├── elasticClient.js      # Elasticsearch client wrapper
│   │   └── nlpProcessor.js       # NLP processing utilities
│   ├── routes/
│   │   └── searchRoutes.js       # API routes
│   ├── middleware/
│   │   ├── validation.js         # Input validation
│   │   ├── rateLimiter.js        # Rate limiting
│   │   └── errorHandler.js       # Error handling
│   ├── utils/
│   │   └── logger.js             # Winston logger
│   ├── app.js                    # Express app configuration
│   └── server.js                 # Server entry point
├── tests/
│   └── search.test.js            # Test suite
├── logs/                         # Log files
├── Dockerfile                    # Docker configuration
├── docker-compose.yml            # Docker Compose setup
├── package.json
├── .env.example
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- Elasticsearch 8.x
- Docker & Docker Compose (optional)

### Local Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd search-service
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Elasticsearch**

Option A: Using Docker
```bash
docker run -d \
  --name elasticsearch \
  -p 9200:9200 -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=true" \
  -e "ELASTIC_PASSWORD=changeme" \
  docker.elastic.co/elasticsearch/elasticsearch:8.10.0
```

Option B: Local Installation
- Download from https://www.elastic.co/downloads/elasticsearch
- Extract and run `bin/elasticsearch`

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start the service**
```bash
# Development
npm run dev

# Production
npm start
```

### Docker Setup

1. **Build and run with Docker Compose**
```bash
docker-compose up -d
```

This will start both Elasticsearch and the search service.

2. **Check service health**
```bash
curl http://localhost:3000/health
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Basic Search
```http
GET /api/search?q={query}&index={index}&from={from}&size={size}&sort={sort}
```

**Parameters:**
- `q` (required): Search query
- `index` (optional): Index name (default: 'products')
- `from` (optional): Pagination offset (default: 0)
- `size` (optional): Results per page (default: 10, max: 100)
- `sort` (optional): Sort field

**Example:**
```bash
curl "http://localhost:3000/api/products/prod-123/similar?size=5"
```

**Response:**
```json
{
  "success": true,
  "baseItem": {...},
  "similarItems": [...]
}
```

#### 8. Index Document
```http
POST /api/{index}/document
Content-Type: application/json

{
  "id": "prod-123",
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop",
  "price": 1299.99,
  "category": "electronics",
  "brand": "Dell",
  "stock": 15,
  "rating": 4.5,
  "tags": ["gaming", "laptop", "high-performance"]
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/products/document" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "prod-123",
    "name": "Gaming Laptop",
    "price": 1299.99,
    "category": "electronics"
  }'
```

#### 9. Bulk Index Documents
```http
POST /api/{index}/bulk
Content-Type: application/json

{
  "documents": [
    { "id": "1", "name": "Product 1", ... },
    { "id": "2", "name": "Product 2", ... }
  ]
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/products/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {"id": "1", "name": "Laptop", "price": 999},
      {"id": "2", "name": "Mouse", "price": 25}
    ]
  }'
```

#### 10. Update Document
```http
PUT /api/{index}/document/{id}
Content-Type: application/json

{
  "price": 1199.99,
  "stock": 20
}
```

#### 11. Delete Document
```http
DELETE /api/{index}/document/{id}
```

#### 12. Get Document by ID
```http
GET /api/{index}/document/{id}
```

#### 13. Get Analytics
```http
GET /api/analytics?days={days}
```

**Example:**
```bash
curl "http://localhost:3000/api/analytics?days=7"
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "topSearches": [...],
    "noResultsQueries": [...],
    "averageResultsPerSearch": 8.5,
    "totalSearches": 15430,
    "period": "Last 7 days"
  }
}
```

## 🔍 Search Query Examples

### Natural Language Queries

The service supports natural language queries with NLP processing:

```bash
# Price-based queries
"laptops under $1000"
"phones between $500 and $800"
"cheap headphones"

# Quality-based queries
"best rated laptops"
"top gaming keyboards"
"highest quality cameras"

# Brand-specific queries
"apple laptops"
"samsung phones"

# Intent-based queries
"compare laptops"
"find gaming mouse"
"show me budget tablets"
```

### Advanced Filter Combinations

```bash
# Multiple filters
curl "http://localhost:3000/api/search/advanced?\
q=laptop&\
category=electronics&\
brand=dell&\
minPrice=800&\
maxPrice=1500&\
minRating=4.0&\
inStock=true&\
sort=price_asc"

# With pagination
curl "http://localhost:3000/api/search?q=phone&from=0&size=20"

# Sort by different fields
curl "http://localhost:3000/api/search/advanced?\
q=laptop&\
sort=rating"  # Options: relevance, price_asc, price_desc, rating, newest, popular
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Manual Testing

1. **Index sample data:**
```bash
curl -X POST "http://localhost:3000/api/products/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "1",
        "name": "Dell XPS 15 Laptop",
        "description": "High-performance laptop for professionals",
        "price": 1299.99,
        "category": "electronics",
        "brand": "Dell",
        "stock": 15,
        "rating": 4.7,
        "reviewCount": 234,
        "tags": ["laptop", "professional", "high-performance"]
      },
      {
        "id": "2",
        "name": "Apple iPhone 15",
        "description": "Latest iPhone with advanced camera",
        "price": 999.99,
        "category": "electronics",
        "brand": "Apple",
        "stock": 50,
        "rating": 4.8,
        "reviewCount": 567,
        "tags": ["phone", "smartphone", "apple"]
      },
      {
        "id": "3",
        "name": "Sony WH-1000XM5 Headphones",
        "description": "Premium noise-canceling headphones",
        "price": 399.99,
        "category": "audio",
        "brand": "Sony",
        "stock": 30,
        "rating": 4.9,
        "reviewCount": 890,
        "tags": ["headphones", "wireless", "noise-canceling"]
      }
    ]
  }'
```

2. **Test search:**
```bash
curl "http://localhost:3000/api/search?q=laptop"
```

3. **Test autocomplete:**
```bash
curl "http://localhost:3000/api/autocomplete?q=iph"
```

4. **Test semantic search:**
```bash
curl "http://localhost:3000/api/search/semantic?q=cheap phone"
```

## 🎯 NLP Processing Examples

### Query Processing

Input: "find cheap laptops under $1000"

Processing:
```javascript
{
  original: "find cheap laptops under $1000",
  tokens: ["find", "cheap", "laptops", "under", "$1000"],
  stemmed: ["find", "cheap", "laptop", "under", "1000"],
  intent: ["search", "price"],
  entities: {
    brands: [],
    numbers: [1000],
    money: ["$1000"]
  },
  keywords: [
    { term: "laptop", tfidf: 0.85 },
    { term: "cheap", tfidf: 0.72 }
  ],
  priceRange: { max: 1000 }
}
```

### Intent Detection

The system detects various intents:
- **search**: "find", "search", "look for"
- **filter**: "only", "just", "exclude"
- **sort**: "sort by", "order by"
- **compare**: "compare", "versus"
- **price**: "cheap", "expensive", "affordable"
- **quality**: "best", "top rated", "premium"

### Synonym Expansion

Input: "phone"
Expanded: ["phone", "mobile", "smartphone", "cell phone"]

This improves recall by matching related terms.

## 🔧 Configuration

### Elasticsearch Index Configuration

The service automatically creates indices with optimized settings:

```javascript
{
  settings: {
    number_of_shards: 2,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        custom_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding", "synonym_filter", "stop", "snowball"]
        },
        autocomplete_analyzer: {
          type: "custom",
          tokenizer: "autocomplete_tokenizer",
          filter: ["lowercase", "asciifolding"]
        }
      },
      tokenizer: {
        autocomplete_tokenizer: {
          type: "edge_ngram",
          min_gram: 2,
          max_gram: 20
        }
      }
    }
  }
}
```

### Custom Synonyms

Add synonyms in `src/config/elasticsearch.js`:

```javascript
synonym_filter: {
  type: 'synonym',
  synonyms: [
    'phone, mobile, smartphone',
    'laptop, notebook, computer',
    'tv, television',
    // Add more synonyms
  ]
}
```

### Boosting Configuration

Adjust field boosting for relevance tuning:

```javascript
const fields = [
  'name^3',           // Name is most important
  'description',      // Default boost
  'category.text',    // Category
  'brand^2',          // Brand is important
  'tags^1.5'          // Tags are moderately important
];
```

## 📊 Performance Optimization

### Indexing Best Practices

1. **Bulk Indexing**: Use bulk API for multiple documents
2. **Refresh Interval**: Adjust refresh interval for better indexing performance
3. **Replica Management**: Start with 0 replicas during bulk indexing

```bash
# Disable replicas during bulk indexing
curl -X PUT "localhost:9200/products/_settings" \
  -H 'Content-Type: application/json' \
  -d '{"index": {"number_of_replicas": 0}}'

# Re-enable after indexing
curl -X PUT "localhost:9200/products/_settings" \
  -H 'Content-Type: application/json' \
  -d '{"index": {"number_of_replicas": 1}}'
```

### Search Optimization

1. **Use Filters**: Filters are cached and faster than queries
2. **Limit Field Fetching**: Only fetch required fields
3. **Use Pagination**: Limit result size
4. **Avoid Deep Pagination**: Use search_after for large datasets

### Caching Strategy

Implement application-level caching for frequent queries:

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// In controller
const cacheKey = `search:${query}:${JSON.stringify(filters)}`;
const cached = cache.get(cacheKey);
if (cached) return res.json(cached);

// ... perform search ...
cache.set(cacheKey, results);
```

## 🚀 Production Deployment

### Environment Variables

Production `.env`:
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

ELASTICSEARCH_NODE=https://your-es-cluster.com:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your-secure-password

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Docker Deployment

1. **Build image:**
```bash
docker build -t search-service:latest .
```

2. **Run container:**
```bash
docker run -d \
  --name search-service \
  -p 3000:3000 \
  --env-file .env \
  search-service:latest
```

3. **With Docker Compose:**
```bash
docker-compose up -d --build
```

### Kubernetes Deployment

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: search-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: search-service
  template:
    metadata:
      labels:
        app: search-service
    spec:
      containers:
      - name: search-service
        image: search-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: ELASTICSEARCH_NODE
          valueFrom:
            secretKeyRef:
              name: es-secrets
              key: node
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: search-service
spec:
  selector:
    app: search-service
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f k8s-deployment.yaml
```

### Health Monitoring

The service includes a health endpoint:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "OK",
  "service": "search-service",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Logging

Logs are written to:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs
- Console (development only)

View logs:
```bash
# Docker
docker logs search-service

# Docker Compose
docker-compose logs -f search-service

# Local
tail -f logs/combined.log
```

## 🔒 Security

### Rate Limiting

Default: 100 requests per minute per IP

Configure in `src/middleware/rateLimiter.js`

### Input Validation

All inputs are validated to prevent injection attacks.

### Elasticsearch Security

Enable security in Elasticsearch:

```yaml
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
```

## 📈 Monitoring & Analytics

### Search Analytics

Track:
- Top searches
- No-results queries
- Average results per search
- Search latency
- Popular filters

Access via:
```bash
curl "http://localhost:3000/api/analytics?days=7"
```

### Performance Metrics

Monitor:
- Response time
- Index size
- Query performance
- Cache hit ratio

## 🐛 Troubleshooting

### Common Issues

1. **Cannot connect to Elasticsearch**
   - Check if Elasticsearch is running
   - Verify connection settings in `.env`
   - Check firewall rules

2. **Search returns no results**
   - Verify documents are indexed
   - Check index exists: `curl localhost:9200/_cat/indices`
   - Refresh index: `curl -X POST localhost:9200/products/_refresh`

3. **Slow search performance**
   - Check index size and shard count
   - Optimize queries (use filters)
   - Increase Elasticsearch heap size
   - Add more replicas

4. **Out of memory errors**
   - Increase Node.js heap size: `NODE_OPTIONS="--max-old-space-size=4096"`
   - Reduce result size
   - Implement pagination

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📚 Additional Resources

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Natural NLP Library](https://github.com/NaturalNode/natural)
- [Compromise NLP](https://github.com/spencermountain/compromise)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning or production!

## 🙋 Support

For issues or questions:
- Open a GitHub issue
- Check existing documentation
- Review logs for error details "http://localhost:3000/api/search?q=laptop&size=5"
```

**Response:**
```json
{
  "success": true,
  "query": {
    "original": "laptop",
    "cleaned": "laptop",
    "intent": ["search"],
    "keywords": [...]
  },
  "results": [...],
  "total": 45,
  "took": 12
}
```

#### 2. Advanced Search
```http
GET /api/search/advanced?q={query}&category={cat}&brand={brand}&minPrice={min}&maxPrice={max}&minRating={rating}&inStock={bool}&sort={field}
```

**Example:**
```bash
curl "http://localhost:3000/api/search/advanced?q=laptop&category=electronics&minPrice=500&maxPrice=1500&sort=rating"
```

**Response includes aggregations:**
```json
{
  "success": true,
  "results": [...],
  "aggregations": {
    "categories": {...},
    "brands": {...},
    "price_ranges": {...}
  }
}
```

#### 3. Semantic Search (NLP-Enhanced)
```http
GET /api/search/semantic?q={query}
```

Expands query with synonyms and uses NLP for better results.

**Example:**
```bash
curl "http://localhost:3000/api/search/semantic?q=cheap phone"
```

#### 4. Autocomplete
```http
GET /api/autocomplete?q={prefix}&size={size}
```

**Example:**
```bash
curl "http://localhost:3000/api/autocomplete?q=lap"
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {"text": "Laptop", "category": "electronics", "id": "1"},
    {"text": "Laptop Stand", "category": "accessories", "id": "2"}
  ]
}
```

#### 5. Search Suggestions (Did You Mean?)
```http
GET /api/suggestions?q={query}
```

**Example:**
```bash
curl "http://localhost:3000/api/suggestions?q=lapto"
```

#### 6. Fuzzy Search (Typo-Tolerant)
```http
GET /api/search/fuzzy?q={query}&field={field}
```

**Example:**
```bash
curl "http://localhost:3000/api/search/fuzzy?q=smratphone&field=name"
```

#### 7. Similar Items
```http
GET /api/{index}/{id}/similar?size={size}
```

**Example:**
```bash
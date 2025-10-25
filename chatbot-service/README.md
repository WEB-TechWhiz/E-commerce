 # AI Chatbot Service

A production-ready chatbot service powered by OpenAI's GPT models with conversation management, context handling, and advanced features.

## 🚀 Features

### Core Capabilities
- **Multi-Model Support** - GPT-4 and GPT-3.5 Turbo
- **Conversation Management** - Persistent conversation history
- **Context Handling** - Intelligent context tracking
- **Intent Detection** - Automatic user intent recognition
- **Entity Extraction** - Extract key information from messages
- **Content Moderation** - OpenAI moderation API integration
- **Streaming Responses** - Real-time message streaming
- **Multiple Bot Types** - Customer support, sales, technical, e-commerce

### Advanced Features
- **Function Calling** - Integration with external APIs
- **Embeddings Generation** - Semantic search capabilities
- **Conversation Analytics** - Track metrics and summaries
- **Rate Limiting** - API protection
- **Authentication** - JWT-based auth with anonymous support
- **Error Handling** - Comprehensive error management
- **Logging** - Winston-based structured logging

## 📁 Project Structure

```
chatbot-service/
├── src/
│   ├── controllers/
│   │   └── chatController.js       # Request handlers
│   ├── services/
│   │   ├── openAIClient.js         # OpenAI API wrapper
│   │   └── dialogManager.js        # Conversation logic
│   ├── routes/
│   │   └── chatRoutes.js           # API routes
│   ├── middleware/
│   │   ├── auth.js                 # Authentication
│   │   ├── rateLimiter.js          # Rate limiting
│   │   ├── validation.js           # Input validation
│   │   └── errorHandler.js         # Error handling
│   ├── utils/
│   │   ├── logger.js               # Winston logger
│   │   └── conversationStore.js    # Conversation storage
│   ├── app.js                      # Express app
│   └── server.js                   # Server entry point
├── tests/
│   └── chatbot.test.js             # Test suite
├── logs/                           # Log files
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- OpenAI API Key
- Docker (optional)

### Local Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd chatbot-service
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
JWT_SECRET=your-secret-key
PORT=3000
```

4. **Start the service**
```bash
# Development
npm run dev

# Production
npm start
```

### Docker Setup

1. **Build and run**
```bash
docker-compose up -d
```

2. **Check health**
```bash
curl http://localhost:3000/health
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

Optional for most endpoints. Include JWT token in header:
```
Authorization: Bearer <token>
```

### Endpoints

#### 1. Initialize Conversation
```http
POST /api/conversations
Content-Type: application/json

{
  "type": "customer_support",
  "metadata": {
    "source": "web",
    "userId": "user-123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "conversationId": "conv_1234567890_abc123",
  "message": "Conversation initialized"
}
```

**Conversation Types:**
- `default` - General purpose chatbot
- `customer_support` - Customer service assistant
- `sales` - Sales and product assistance
- `technical` - Technical support
- `ecommerce` - E-commerce shopping assistant

#### 2. Send Message
```http
POST /api/chat
Content-Type: application/json

{
  "conversationId": "conv_1234567890_abc123",
  "message": "Hello, I need help with my order"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Hello! I'd be happy to help you with your order. Could you please provide your order number?",
  "intent": "help",
  "entities": {
    "numbers": [],
    "emails": [],
    "urls": [],
    "dates": []
  },
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 28,
    "total_tokens": 73
  }
}
```

#### 3. Stream Message (SSE)
```http
POST /api/chat/stream
Content-Type: application/json

{
  "conversationId": "conv_1234567890_abc123",
  "message": "Tell me about your products"
}
```

**Response:** Server-Sent Events stream
```
data: {"content":"I"}
data: {"content":" can"}
data: {"content":" help"}
...
data: {"done":true}
```

**Client Example:**
```javascript
const response = await fetch('http://localhost:3000/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ conversationId, message })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.content) {
        console.log(data.content);
      }
    }
  }
}
```

#### 4. Get Conversation History
```http
GET /api/conversations/:conversationId
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "conv_1234567890_abc123",
    "type": "customer_support",
    "messages": [
      {
        "role": "user",
        "content": "Hello",
        "timestamp": "2024-01-01T12:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "Hi! How can I help?",
        "timestamp": "2024-01-01T12:00:01.000Z"
      }
    ],
    "context": {},
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:01.000Z"
  }
}
```

#### 5. Get User Conversations
```http
GET /api/conversations
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv_1234567890_abc123",
      "type": "customer_support",
      "messageCount": 10,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:30:00.000Z"
    }
  ]
}
```

#### 6. Get Conversation Summary
```http
GET /api/conversations/:conversationId/summary
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "conversationId": "conv_1234567890_abc123",
    "type": "customer_support",
    "messageCount": 10,
    "userMessages": 5,
    "assistantMessages": 5,
    "duration": 30,
    "lastActivity": "2024-01-01T12:30:00.000Z",
    "context": {}
  }
}
```

#### 7. Update Conversation Context
```http
PUT /api/conversations/:conversationId/context
Content-Type: application/json

{
  "context": {
    "userId": "user-123",
    "orderId": "ORD-456",
    "preferences": {
      "language": "en",
      "notifications": true
    }
  }
}
```

#### 8. Clear Conversation History
```http
POST /api/conversations/:conversationId/clear
Content-Type: application/json

{
  "keepLast": 2
}
```

#### 9. Delete Conversation
```http
DELETE /api/conversations/:conversationId
```

#### 10. Generate Embeddings
```http
POST /api/embedding
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "What is the meaning of life?"
}
```

**Response:**
```json
{
  "success": true,
  "embedding": [0.002, -0.015, 0.089, ...],
  "dimensions": 1536
}
```

#### 11. Moderate Content
```http
POST /api/moderate
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "This is a test message"
}
```

**Response:**
```json
{
  "success": true,
  "moderation": {
    "flagged": false,
    "categories": {
      "hate": false,
      "harassment": false,
      "self-harm": false,
      "sexual": false,
      "violence": false
    },
    "categoryScores": {
      "hate": 0.0001,
      "harassment": 0.0002,
      ...
    }
  }
}
```

## 💡 Usage Examples

### Basic Chat

```javascript
// Initialize conversation
const initResponse = await fetch('http://localhost:3000/api/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'customer_support' })
});

const { conversationId } = await initResponse.json();

// Send message
const chatResponse = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId,
    message: 'I need help with my order #12345'
  })
});

const { response, intent, entities } = await chatResponse.json();
console.log('Bot:', response);
console.log('Intent:', intent);
console.log('Entities:', entities);
```

### With Authentication

```javascript
const token = 'your-jwt-token';

const response = await fetch('http://localhost:3000/api/conversations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ type: 'sales' })
});
```

### Streaming Chat

```javascript
async function streamChat(conversationId, message) {
  const response = await fetch('http://localhost:3000/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.content) {
          fullResponse += data.content;
          process.stdout.write(data.content);
        }
      }
    }
  }

  return fullResponse;
}
```

## 🎯 Intent Detection

The service automatically detects user intents:

- **greeting**: "hello", "hi", "hey"
- **farewell**: "bye", "goodbye"
- **help**: "help", "support", "assist"
- **product_search**: "find", "search", "looking for"
- **order_status**: "order", "track", "status"
- **complaint**: "complaint", "issue", "problem"
- **recommendation**: "recommend", "suggest", "best"

Example:
```json
{
  "message": "I'm looking for a laptop under $1000",
  "intent": "product_search",
  "entities": {
    "numbers": ["1000"],
    "emails": [],
    "urls": [],
    "dates": []
  }
}
```

## 🧠 Conversation Types

### Customer Support
```javascript
{
  "type": "customer_support",
  "systemPrompt": "You are a customer support assistant. Be empathetic, professional, and help resolve customer issues."
}
```

### Sales Assistant
```javascript
{
  "type": "sales",
  "systemPrompt": "You are a sales assistant. Help customers find products, answer questions, and guide them through the purchase process."
}
```

### Technical Support
```javascript
{
  "type": "technical",
  "systemPrompt": "You are a technical support assistant. Provide detailed technical solutions and troubleshooting steps."
}
```

### E-commerce
```javascript
{
  "type": "ecommerce",
  "systemPrompt": "You are an e-commerce assistant. Help customers find products, track orders, handle returns, and provide recommendations."
}
```

## 🔧 Configuration

### Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# OpenAI
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4-turbo-preview

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# CORS
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

### OpenAI Models

Available models:
- `gpt-3.5-turbo` - Fast and cost-effective (default)
- `gpt-4-turbo-preview` - Most capable, slower, more expensive

Configure in `.env`:
```env
OPENAI_MODEL=gpt-4-turbo-preview
```

### Rate Limiting

Adjust in `src/middleware/rateLimiter.js`:

```javascript
const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 30,                   // 30 requests per minute
});
```

### Conversation Context Window

Configure in `src/services/dialogManager.js`:

```javascript
this.contextWindow = 10; // Keep last 10 messages
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

### Manual Testing

1. **Get auth token (for testing):**

```javascript
const { generateToken } = require('./src/middleware/auth');
const token = generateToken('test-user-123');
console.log('Token:', token);
```

2. **Test conversation flow:**

```bash
# Initialize
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"type":"customer_support"}'

# Send message
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_1234567890_abc123",
    "message": "Hello, I need help"
  }'

# Get history
curl http://localhost:3000/api/conversations/conv_1234567890_abc123
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "OK",
  "service": "chatbot-service",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600
}
```

### Logs

Logs are written to:
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs
- Console (development only)

View logs:
```bash
# Docker
docker logs chatbot-service -f

# Local
tail -f logs/combined.log
```

### Metrics to Monitor

- Response time
- Token usage
- Error rate
- Conversation duration
- Message count per conversation
- Intent distribution

## 🚀 Production Deployment

### Docker Deployment

1. **Build image:**
```bash
docker build -t chatbot-service:latest .
```

2. **Run container:**
```bash
docker run -d \
  --name chatbot-service \
  -p 3000:3000 \
  -e OPENAI_API_KEY=sk-your-key \
  -e JWT_SECRET=your-secret \
  chatbot-service:latest
```

3. **Docker Compose:**
```bash
docker-compose up -d
```

### Kubernetes Deployment

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chatbot-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chatbot-service
  template:
    metadata:
      labels:
        app: chatbot-service
    spec:
      containers:
      - name: chatbot-service
        image: chatbot-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: chatbot-secrets
              key: openai-key
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: chatbot-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: chatbot-service
spec:
  selector:
    app: chatbot-service
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f k8s-deployment.yaml
```

### Environment-Specific Configs

**Development:**
```env
NODE_ENV=development
LOG_LEVEL=debug
OPENAI_MODEL=gpt-3.5-turbo
```

**Production:**
```env
NODE_ENV=production
LOG_LEVEL=info
OPENAI_MODEL=gpt-4-turbo-preview
```

## 🔒 Security

### Content Moderation

All messages are automatically moderated using OpenAI's moderation API:

```javascript
const moderation = await openAIClient.moderateContent(message);

if (moderation.flagged) {
  return res.status(400).json({
    error: 'Message contains inappropriate content',
    categories: moderation.categories
  });
}
```

### Rate Limiting

Default: 30 requests per minute per IP

Configure in environment:
```env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### Authentication

JWT-based authentication with optional anonymous access:

```javascript
// Requires auth
router.post('/conversations', requireAuth, controller.initConversation);

// Optional auth
router.post('/chat', optionalAuth, controller.sendMessage);
```

### Input Validation

All inputs are validated:
- Message length (max 4000 chars)
- Required fields
- Type checking
- Sanitization

## 💰 Cost Management

### Token Usage Tracking

Every response includes token usage:

```json
{
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 28,
    "total_tokens": 73
  }
}
```

### Cost Estimation

**GPT-3.5 Turbo:**
- Input: $0.0015 / 1K tokens
- Output: $0.002 / 1K tokens

**GPT-4 Turbo:**
- Input: $0.01 / 1K tokens
- Output: $0.03 / 1K tokens

### Optimization Tips

1. **Limit context window:**
   - Keep only last N messages
   - Summarize older conversations

2. **Use appropriate model:**
   - GPT-3.5 for simple tasks
   - GPT-4 for complex reasoning

3. **Set max_tokens:**
   ```javascript
   { max_tokens: 500 } // Limit response length
   ```

4. **Cache common responses:**
   - FAQ answers
   - Greeting messages
   - Standard replies

## 🔌 Integration Examples

### React Frontend

```jsx
import { useState, useEffect } from 'react';

function Chatbot() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Initialize conversation
    fetch('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'customer_support' })
    })
    .then(res => res.json())
    .then(data => setConversationId(data.conversationId));
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    // Send to API
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message: input })
    });

    const data = await response.json();
    
    // Add bot response
    setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    setInput('');
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={input} 
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

### Node.js Client

```javascript
const axios = require('axios');

class ChatbotClient {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.conversationId = null;
  }

  async init(type = 'default') {
    const response = await axios.post(`${this.baseURL}/conversations`, { type });
    this.conversationId = response.data.conversationId;
    return this.conversationId;
  }

  async chat(message) {
    const response = await axios.post(`${this.baseURL}/chat`, {
      conversationId: this.conversationId,
      message
    });
    return response.data;
  }

  async getHistory() {
    const response = await axios.get(
      `${this.baseURL}/conversations/${this.conversationId}`
    );
    return response.data.conversation;
  }
}

// Usage
const bot = new ChatbotClient();
await bot.init('customer_support');
const response = await bot.chat('Hello!');
console.log(response.response);
```

### Python Client

```python
import requests

class ChatbotClient:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
        self.conversation_id = None
    
    def init(self, type='default'):
        response = requests.post(
            f'{self.base_url}/conversations',
            json={'type': type}
        )
        self.conversation_id = response.json()['conversationId']
        return self.conversation_id
    
    def chat(self, message):
        response = requests.post(
            f'{self.base_url}/chat',
            json={
                'conversationId': self.conversation_id,
                'message': message
            }
        )
        return response.json()

# Usage
bot = ChatbotClient()
bot.init('customer_support')
response = bot.chat('Hello!')
print(response['response'])
```

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Key Error**
   - Verify key is correct in `.env`
   - Check key has sufficient credits
   - Ensure key has proper permissions

2. **Rate Limit Errors**
   - Reduce request frequency
   - Upgrade OpenAI plan
   - Implement request queuing

3. **Slow Responses**
   - Use GPT-3.5 instead of GPT-4
   - Reduce max_tokens
   - Optimize system prompts

4. **Memory Issues**
   - Implement conversation cleanup
   - Use external storage (Redis/MongoDB)
   - Limit conversation history

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

View logs in real-time:
```bash
npm run dev | bunyan
```

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GPT Best Practices](https://platform.openai.com/docs/guides/gpt-best-practices)
- [Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)

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
- Check logs for error details
- Review API documentation
- Test with health endpointmodule.exports = ConversationStore;
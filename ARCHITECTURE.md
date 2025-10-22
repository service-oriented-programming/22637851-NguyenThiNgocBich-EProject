# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│                    (Postman, Frontend App)                   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTP Requests
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       API GATEWAY                            │
│                      Port: 3003                              │
│                                                              │
│  Routes:                                                     │
│  • /auth/*      → Auth Service                              │
│  • /products/*  → Product Service                           │
│  • /orders/*    → Order Service                             │
└────────┬────────────────┬────────────────┬──────────────────┘
         │                │                │
         │                │                │
    ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
    │  Auth   │      │ Product │     │  Order  │
    │ Service │      │ Service │     │ Service │
    │ :3000   │      │ :3001   │     │ :3002   │
    └────┬────┘      └────┬────┘     └────┬────┘
         │                │                │
         │                │                │
         └────────┬───────┴────────┬───────┘
                  │                │
                  ▼                ▼
         ┌────────────┐   ┌────────────┐
         │  MongoDB   │   │  RabbitMQ  │
         │  :37017    │   │  :5672     │
         └────────────┘   └────────────┘
```

---

## Service Communication Flow

### 1. User Registration Flow

```
Client
  │
  │ POST /auth/register
  │ { username, password }
  ▼
API Gateway
  │
  │ Forward to Auth Service
  ▼
Auth Service
  │
  │ 1. Check if username exists
  │ 2. Hash password (bcryptjs)
  │ 3. Save to MongoDB
  ▼
MongoDB
  │
  │ User saved
  ▼
Auth Service
  │
  │ Return success response
  ▼
Client
```

### 2. User Login Flow

```
Client
  │
  │ POST /auth/login
  │ { username, password }
  ▼
API Gateway
  │
  │ Forward to Auth Service
  ▼
Auth Service
  │
  │ 1. Find user in MongoDB
  │ 2. Verify password
  │ 3. Generate JWT token
  ▼
Client
  │
  │ Receive JWT token
  │ Store for future requests
  ▼
```

### 3. Create Product Flow

```
Client
  │
  │ POST /products/api/products
  │ Headers: Authorization: Bearer <token>
  │ Body: { name, price, description }
  ▼
API Gateway
  │
  │ Forward to Product Service
  ▼
Product Service
  │
  │ 1. Verify JWT token
  │ 2. Validate product data
  │ 3. Save to MongoDB
  ▼
MongoDB
  │
  │ Product saved
  ▼
Product Service
  │
  │ Return product with _id
  ▼
Client
```

### 4. Place Order Flow (Message Queue)

```
Client
  │
  │ POST /products/api/products/buy
  │ Headers: Authorization: Bearer <token>
  │ Body: { ids: [...] }
  ▼
API Gateway
  │
  │ Forward to Product Service
  ▼
Product Service
  │
  │ 1. Verify JWT token
  │ 2. Find products by IDs
  │ 3. Generate order ID
  │ 4. Publish to RabbitMQ "orders" queue
  ▼
RabbitMQ
  │
  │ Message in "orders" queue
  ▼
Order Service (Consumer)
  │
  │ 1. Consume message from queue
  │ 2. Calculate total price
  │ 3. Save order to MongoDB
  │ 4. Send ACK to queue
  │ 5. Publish to "products" queue
  ▼
RabbitMQ
  │
  │ Message in "products" queue
  ▼
Product Service (Consumer)
  │
  │ 1. Consume message
  │ 2. Update order status
  │ 3. Return to client
  ▼
Client
  │
  │ Receive completed order
  │ { status, products, totalPrice, user }
  ▼
```

---

## Data Models

### User Model (Auth Service)

```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  password: String (hashed, required),
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model (Product Service)

```javascript
{
  _id: ObjectId,
  name: String (required),
  price: Number (required),
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model (Order Service)

```javascript
{
  _id: ObjectId,
  user: String (username),
  products: [
    {
      _id: ObjectId,
      name: String,
      price: Number
    }
  ],
  totalPrice: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication Flow

```
┌─────────┐
│  Login  │
└────┬────┘
     │
     │ POST /auth/login
     │ { username, password }
     ▼
┌──────────────┐
│ Auth Service │
└──────┬───────┘
       │
       │ Verify credentials
       │ Generate JWT
       ▼
┌─────────────────────────────────┐
│  JWT Token                      │
│  {                              │
│    username: "john_doe",        │
│    iat: 1234567890,             │
│    exp: 1234571490              │
│  }                              │
│  Signed with JWT_SECRET         │
└─────────────────────────────────┘
       │
       │ Return to client
       ▼
┌─────────────────────────────────┐
│  Client stores token            │
│  For all future requests:       │
│  Authorization: Bearer <token>  │
└─────────────────────────────────┘
       │
       │ Protected request
       ▼
┌──────────────────────────────────┐
│  Product/Order Service           │
│  1. Extract token from header    │
│  2. Verify signature             │
│  3. Decode payload               │
│  4. Check expiration             │
│  5. Process request              │
└──────────────────────────────────┘
```

---

## Message Queue Architecture

```
┌──────────────────┐
│ Product Service  │
│   (Publisher)    │
└────────┬─────────┘
         │
         │ Publish order message
         │ { products, username, orderId }
         ▼
┌─────────────────────────────────┐
│       RabbitMQ                  │
│                                 │
│  ┌─────────────────┐            │
│  │  "orders" Queue │            │
│  └────────┬────────┘            │
│           │                     │
│           │ Message routing     │
│           ▼                     │
│  ┌─────────────────┐            │
│  │ "products" Queue│            │
│  └────────┬────────┘            │
└───────────┼─────────────────────┘
            │
            │ Consume messages
            ▼
┌──────────────────┐
│  Order Service   │
│   (Consumer)     │
└──────────────────┘
```

### Message Flow Details

1. **Product Service** publishes order to "orders" queue
2. **Order Service** consumes from "orders" queue
3. **Order Service** processes and saves to MongoDB
4. **Order Service** publishes result to "products" queue
5. **Product Service** consumes from "products" queue
6. **Product Service** updates order status and returns to client

---

## Docker Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │              app-network (Bridge)                  │     │
│  │                                                     │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │     │
│  │  │   Auth   │  │ Product  │  │  Order   │         │     │
│  │  │Container │  │Container │  │Container │         │     │
│  │  └──────────┘  └──────────┘  └──────────┘         │     │
│  │                                                     │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │     │
│  │  │   API    │  │  MongoDB │  │ RabbitMQ │         │     │
│  │  │ Gateway  │  │Container │  │Container │         │     │
│  │  └──────────┘  └──────────┘  └──────────┘         │     │
│  │                                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Port Mappings:                                              │
│  • 3003:3003 → API Gateway                                   │
│  • 3001:3001 → Product Service                               │
│  • 37017:27017 → MongoDB                                     │
│  • 5672:5672 → RabbitMQ                                      │
│  • 15672:15672 → RabbitMQ Management UI                      │
│                                                              │
│  Volumes:                                                    │
│  • mongo_data → /data/db (Persistent storage)                │
└─────────────────────────────────────────────────────────────┘
```

---

## CI/CD Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Push / Pull Request
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Actions                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Job 1: test-auth-service                            │   │
│  │  • Checkout code                                     │   │
│  │  • Setup Node.js 18                                  │   │
│  │  • Install dependencies                              │   │
│  │  • Run tests                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Job 2: test-product-service                         │   │
│  │  • Checkout code                                     │   │
│  │  • Setup Node.js 18                                  │   │
│  │  • Install dependencies                              │   │
│  │  • Run tests                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Job 3: build-docker-images                          │   │
│  │  (Runs only if tests pass)                           │   │
│  │  • Checkout code                                     │   │
│  │  • Setup Docker Buildx                               │   │
│  │  • Build auth-service:latest                         │   │
│  │  • Build product-service:latest                      │   │
│  │  • Build order-service:latest                        │   │
│  │  • Build api-gateway:latest                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Job 4: docker-compose-test                          │   │
│  │  • Validate docker-compose.yaml                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ ✅ All jobs passed
                         ▼
                   Ready for deployment
```

---

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                           │
│                     (HTTPS/SSL)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Cluster                        │
│              (Multiple instances for HA)                     │
└────┬─────────────────┬─────────────────┬────────────────────┘
     │                 │                 │
     ▼                 ▼                 ▼
┌─────────┐      ┌─────────┐      ┌─────────┐
│  Auth   │      │ Product │      │  Order  │
│ Cluster │      │ Cluster │      │ Cluster │
└────┬────┘      └────┬────┘      └────┬────┘
     │                │                │
     └────────┬───────┴────────┬───────┘
              │                │
              ▼                ▼
     ┌────────────┐   ┌────────────┐
     │  MongoDB   │   │  RabbitMQ  │
     │  Replica   │   │  Cluster   │
     │    Set     │   │            │
     └────────────┘   └────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: Network Security              │
│  • HTTPS/TLS encryption                 │
│  • Firewall rules                       │
│  • VPC/Private networks                 │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Layer 2: API Gateway                   │
│  • Rate limiting                        │
│  • CORS configuration                   │
│  • Request validation                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Layer 3: Authentication                │
│  • JWT token verification               │
│  • Token expiration                     │
│  • Authorization middleware             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Layer 4: Application Security          │
│  • Input validation                     │
│  • SQL injection prevention             │
│  • XSS protection                       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Layer 5: Data Security                 │
│  • Password hashing (bcryptjs)          │
│  • Environment variables for secrets    │
│  • Database encryption at rest          │
└─────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling

```
Single Instance              Multiple Instances
┌──────────┐                ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Product  │       →        │ Product  │ │ Product  │ │ Product  │
│ Service  │                │ Service  │ │ Service  │ │ Service  │
└──────────┘                │ Instance │ │ Instance │ │ Instance │
                            │    1     │ │    2     │ │    3     │
                            └──────────┘ └──────────┘ └──────────┘
                                   │           │           │
                                   └───────────┴───────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │  Load Balancer    │
                                    └───────────────────┘
```

### Database Scaling

```
Single MongoDB              MongoDB Replica Set
┌──────────┐                ┌──────────┐ ┌──────────┐ ┌──────────┐
│ MongoDB  │       →        │ Primary  │ │Secondary │ │Secondary │
└──────────┘                └────┬─────┘ └────┬─────┘ └────┬─────┘
                                 │            │            │
                                 └────────────┴────────────┘
                                        Replication
```

---

## Monitoring and Observability

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │   Auth   │  │ Product  │  │  Order   │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
└───────┼─────────────┼─────────────┼─────────────────────────┘
        │             │             │
        │ Logs        │ Metrics     │ Traces
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Observability Stack                         │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Logging │  │ Metrics  │  │ Tracing  │                   │
│  │   (ELK)  │  │(Prometheus)│ │ (Jaeger) │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
└───────┼─────────────┼─────────────┼─────────────────────────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │   Visualization         │
        │   (Grafana/Kibana)      │
        └─────────────────────────┘
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 18 | JavaScript runtime |
| **Framework** | Express.js | Web framework |
| **Database** | MongoDB | Document database |
| **Message Queue** | RabbitMQ | Async communication |
| **Authentication** | JWT | Token-based auth |
| **Password** | bcryptjs | Password hashing |
| **Containerization** | Docker | Application packaging |
| **Orchestration** | Docker Compose | Multi-container management |
| **CI/CD** | GitHub Actions | Automation pipeline |
| **Testing** | Mocha + Chai | Unit testing |
| **API Testing** | Postman | Manual testing |

---

## File Structure

```
Term-Project/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD pipeline
├── auth/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── authController.js     # Login, Register
│   │   ├── models/
│   │   │   └── user.js               # User model
│   │   ├── services/
│   │   │   └── authService.js        # Business logic
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js     # JWT verification
│   │   ├── test/
│   │   │   └── authController.test.js
│   │   └── app.js                    # Express app
│   ├── Dockerfile
│   ├── package.json
│   └── .env
├── product/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── productController.js  # CRUD + Orders
│   │   ├── models/
│   │   │   └── product.js            # Product model
│   │   ├── routes/
│   │   │   └── productRoutes.js      # API routes
│   │   ├── services/
│   │   ├── utils/
│   │   │   ├── messageBroker.js      # RabbitMQ
│   │   │   └── isAuthenticated.js    # Auth middleware
│   │   ├── test/
│   │   │   └── product.test.js
│   │   └── app.js
│   ├── Dockerfile
│   ├── package.json
│   └── .env
├── order/
│   ├── src/
│   │   ├── models/
│   │   │   └── order.js              # Order model
│   │   └── app.js                    # RabbitMQ consumer
│   ├── Dockerfile
│   ├── package.json
│   └── .env
├── api-gateway/
│   ├── index.js                      # HTTP proxy
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yaml               # Multi-container setup
├── Postman_Collection.json           # API tests
├── API_ENDPOINTS.md                  # API documentation
├── TESTING_GUIDE.md                  # Testing instructions
├── CI_CD_SETUP.md                    # CI/CD guide
├── IMPLEMENTATION_SUMMARY.md         # Project summary
├── QUICK_START.md                    # Quick start guide
├── ARCHITECTURE.md                   # This file
└── README.md                         # Project overview
```

---

This architecture is designed for:
- ✅ **Scalability**: Horizontal scaling of services
- ✅ **Reliability**: Message queue for async processing
- ✅ **Security**: JWT authentication, password hashing
- ✅ **Maintainability**: Microservices separation of concerns
- ✅ **Deployability**: Docker containerization
- ✅ **Testability**: Automated testing in CI/CD

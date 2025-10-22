# API Endpoints Documentation

This document describes all available API endpoints for testing with Postman.

## Base URLs

- **API Gateway**: `http://localhost:3003`
- **Auth Service (Direct)**: `http://localhost:3000`
- **Product Service (Direct)**: `http://localhost:3001`
- **Order Service (Direct)**: `http://localhost:3002`

**Note**: All requests should go through the API Gateway in production.

---

## Authentication Service

### [4] Create User Account (Register)

**Endpoint**: `POST /auth/register`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "message": "User registered successfully",
  "user": {
    "username": "testuser",
    "id": "..."
  }
}
```

**Error Response** (400):
```json
{
  "message": "Username already taken"
}
```

---

### [5] User Login

**Endpoint**: `POST /auth/login`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response** (400):
```json
{
  "message": "Invalid credentials"
}
```

**Note**: Save the token from the response. You'll need it for authenticated requests.

---

## Product Service

### [6] Create New Product

**Endpoint**: `POST /products/api/products`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

**Request Body**:
```json
{
  "name": "Laptop",
  "price": 999.99,
  "description": "High-performance laptop"
}
```

**Success Response** (201):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Laptop",
  "price": 999.99,
  "description": "High-performance laptop",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Response** (401):
```json
{
  "message": "Unauthorized"
}
```

---

### Get All Products

**Endpoint**: `GET /products/api/products`

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Success Response** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Laptop",
    "price": 999.99,
    "description": "High-performance laptop"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Mouse",
    "price": 29.99,
    "description": "Wireless mouse"
  }
]
```

---

### [8] Get Product by ID

**Endpoint**: `GET /products/api/products/:id`

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Example**: `GET /products/api/products/507f1f77bcf86cd799439011`

**Success Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Laptop",
  "price": 999.99,
  "description": "High-performance laptop"
}
```

**Error Response** (404):
```json
{
  "message": "Product not found"
}
```

**Error Response** (400):
```json
{
  "message": "Invalid product ID format"
}
```

---

### [7] Place an Order (Buy Products)

**Endpoint**: `POST /products/api/products/buy`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

**Request Body**:
```json
{
  "ids": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ]
}
```

**Success Response** (201):
```json
{
  "status": "completed",
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Laptop",
      "price": 999.99
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Mouse",
      "price": 29.99
    }
  ],
  "username": "testuser",
  "totalPrice": 1029.98,
  "user": "testuser"
}
```

**Error Response** (401):
```json
{
  "message": "Unauthorized"
}
```

---

## Invoice/Order Service

### Get Invoice (Order) by ID

**Endpoint**: `GET /products/api/products/invoice/:id`

**Description**: Retrieves order details formatted as an invoice. Uses the existing Order model from the order service.

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Example**: `GET /products/api/products/invoice/670fa12a9d1cbe45b91234f0`

**Success Response** (200):
```json
{
  "invoiceId": "670fa12a9d1cbe45b91234f0",
  "user": "testuser",
  "products": [
    {
      "id": "670fa12a9d1cbe45b9e87654",
      "name": "Laptop Dell XPS 13",
      "price": 1500
    },
    {
      "id": "670fa12a9d1cbe45b9e87655",
      "name": "Wireless Mouse",
      "price": 50
    }
  ],
  "totalAmount": 1550,
  "createdAt": "2025-10-20T10:00:00.000Z",
  "status": "completed"
}
```

**Error Response** (404):
```json
{
  "message": "Order (invoice) not found"
}
```

**Error Response** (400):
```json
{
  "message": "Invalid order ID format"
}
```

**Error Response** (401):
```json
{
  "message": "Unauthorized"
}
```

**Note**: This endpoint retrieves order data from the `orders` collection and populates product details. The order is created automatically when using the `/products/api/products/buy` endpoint.

---

## Testing Workflow with Postman

### Step 1: Register a User
1. Send `POST /auth/register` with username and password
2. Verify you receive a success response

### Step 2: Login
1. Send `POST /auth/login` with the same credentials
2. Copy the JWT token from the response

### Step 3: Create Products
1. Add the token to Authorization header as `Bearer <token>`
2. Send `POST /products/api/products` to create multiple products
3. Save the product IDs from responses

### Step 4: Get All Products
1. Send `GET /products/api/products` with the token
2. Verify all products are listed

### Step 5: Get Product by ID
1. Send `GET /products/api/products/{id}` with a specific product ID
2. Verify the correct product is returned

### Step 6: Place an Order
1. Send `POST /products/api/products/buy` with an array of product IDs
2. Verify the order is created successfully

---

## Common Issues

### 401 Unauthorized
- Ensure you're including the `Authorization: Bearer <token>` header
- Verify the token hasn't expired
- Check that the token format is correct

### 404 Not Found
- Verify the endpoint URL is correct
- Check that the resource ID exists in the database

### 500 Server Error
- Check that MongoDB is running
- Verify RabbitMQ is running (for order operations)
- Check server logs for detailed error messages

---

## Environment Setup

Before testing, ensure all services are running:

```bash
# Using Docker Compose
docker-compose up --build

# Or run services individually
cd auth && npm start
cd product && npm start
cd order && npm start
cd api-gateway && npm start
```

Make sure MongoDB and RabbitMQ are accessible at the configured URIs.
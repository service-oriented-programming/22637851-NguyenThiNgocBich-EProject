# Testing Guide

This guide provides step-by-step instructions for testing all endpoints using Postman.

## Prerequisites

1. **Install Postman**: Download from [postman.com](https://www.postman.com/downloads/)
2. **Start Services**: Run `docker-compose up --build`
3. **Import Collection**: Import `Postman_Collection.json` into Postman

## Quick Start

### Option 1: Import Postman Collection

1. Open Postman
2. Click **Import** button
3. Select `Postman_Collection.json` from the project root
4. The collection will be imported with all endpoints pre-configured

### Option 2: Manual Setup

Follow the steps below to manually test each endpoint.

---

## Test Sequence

### Step 1: Register a New User

**[Task 4] Create User Account**

1. **Method**: POST
2. **URL**: `http://localhost:3003/auth/register`
3. **Headers**:
   ```
   Content-Type: application/json
   ```
4. **Body** (raw JSON):
   ```json
   {
     "username": "john_doe",
     "password": "securePassword123"
   }
   ```
5. **Expected Response** (200 OK):
   ```json
   {
     "message": "User registered successfully",
     "user": {
       "username": "john_doe",
       "id": "..."
     }
   }
   ```

**✅ Success Criteria**: User is created without errors

---

### Step 2: Login with User Credentials

**[Task 5] Successful Login**

1. **Method**: POST
2. **URL**: `http://localhost:3003/auth/login`
3. **Headers**:
   ```
   Content-Type: application/json
   ```
4. **Body** (raw JSON):
   ```json
   {
     "username": "john_doe",
     "password": "securePassword123"
   }
   ```
5. **Expected Response** (200 OK):
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpvaG5fZG9lIiwiaWF0IjoxNjE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
   }
   ```

**✅ Success Criteria**: JWT token is returned

**Important**: Copy the token value. You'll need it for all subsequent requests.

---

### Step 3: Create Products

**[Task 6] Create New Product**

Create multiple products for testing:

#### Product 1: Laptop

1. **Method**: POST
2. **URL**: `http://localhost:3003/products/api/products`
3. **Headers**:
   ```
   Content-Type: application/json
   Authorization: Bearer YOUR_TOKEN_HERE
   ```
4. **Body** (raw JSON):
   ```json
   {
     "name": "Laptop",
     "price": 999.99,
     "description": "High-performance laptop with 16GB RAM"
   }
   ```
5. **Expected Response** (201 Created):
   ```json
   {
     "_id": "507f1f77bcf86cd799439011",
     "name": "Laptop",
     "price": 999.99,
     "description": "High-performance laptop with 16GB RAM",
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

**Save the `_id` value for later use!**

#### Product 2: Wireless Mouse

Repeat the same process with:
```json
{
  "name": "Wireless Mouse",
  "price": 29.99,
  "description": "Ergonomic wireless mouse"
}
```

#### Product 3: Keyboard

```json
{
  "name": "Mechanical Keyboard",
  "price": 149.99,
  "description": "RGB mechanical keyboard"
}
```

**✅ Success Criteria**: All products are created and return 201 status

---

### Step 4: Get All Products

1. **Method**: GET
2. **URL**: `http://localhost:3003/products/api/products`
3. **Headers**:
   ```
   Authorization: Bearer YOUR_TOKEN_HERE
   ```
4. **Expected Response** (200 OK):
   ```json
   [
     {
       "_id": "507f1f77bcf86cd799439011",
       "name": "Laptop",
       "price": 999.99,
       "description": "High-performance laptop with 16GB RAM"
     },
     {
       "_id": "507f1f77bcf86cd799439012",
       "name": "Wireless Mouse",
       "price": 29.99,
       "description": "Ergonomic wireless mouse"
     },
     {
       "_id": "507f1f77bcf86cd799439013",
       "name": "Mechanical Keyboard",
       "price": 149.99,
       "description": "RGB mechanical keyboard"
     }
   ]
   ```

**✅ Success Criteria**: All created products are listed

---

### Step 5: Get Product by ID

**[Task 8] Get Single Product**

1. **Method**: GET
2. **URL**: `http://localhost:3003/products/api/products/507f1f77bcf86cd799439011`
   - Replace `507f1f77bcf86cd799439011` with an actual product ID
3. **Headers**:
   ```
   Authorization: Bearer YOUR_TOKEN_HERE
   ```
4. **Expected Response** (200 OK):
   ```json
   {
     "_id": "507f1f77bcf86cd799439011",
     "name": "Laptop",
     "price": 999.99,
     "description": "High-performance laptop with 16GB RAM"
   }
   ```

**Test Cases**:
- ✅ Valid ID returns product
- ✅ Invalid ID format returns 400 error
- ✅ Non-existent ID returns 404 error

---

### Step 6: Place an Order

**[Task 7] Buy Products**

1. **Method**: POST
2. **URL**: `http://localhost:3003/products/api/products/buy`
3. **Headers**:
   ```
   Content-Type: application/json
   Authorization: Bearer YOUR_TOKEN_HERE
   ```
4. **Body** (raw JSON):
   ```json
   {
     "ids": [
       "507f1f77bcf86cd799439011",
       "507f1f77bcf86cd799439012"
     ]
   }
   ```
   - Replace with actual product IDs from Step 3
5. **Expected Response** (201 Created):
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
         "name": "Wireless Mouse",
         "price": 29.99
       }
     ],
     "username": "john_doe",
     "totalPrice": 1029.98,
     "user": "john_doe"
   }
   ```

**✅ Success Criteria**: Order is created with correct total price

**Note**: This operation may take a few seconds as it involves message queue processing.

---

## Common Issues and Solutions

### Issue 1: 401 Unauthorized

**Symptoms**: All authenticated requests return 401

**Solutions**:
1. Verify you copied the full token from login response
2. Check the Authorization header format: `Bearer <token>`
3. Ensure there's a space between "Bearer" and the token
4. Try logging in again to get a fresh token

### Issue 2: 404 Not Found

**Symptoms**: Endpoint returns 404

**Solutions**:
1. Verify the URL is correct
2. Check that API Gateway is running on port 3003
3. Ensure the service path is correct (e.g., `/products/api/products`)

### Issue 3: 500 Server Error

**Symptoms**: Server returns 500 error

**Solutions**:
1. Check if MongoDB is running: `docker ps | grep mongo`
2. Check if RabbitMQ is running: `docker ps | grep rabbitmq`
3. View service logs: `docker-compose logs <service-name>`
4. Restart services: `docker-compose restart`

### Issue 4: Connection Refused

**Symptoms**: Cannot connect to localhost:3003

**Solutions**:
1. Verify Docker containers are running: `docker-compose ps`
2. Check port mappings: `docker-compose ps`
3. Restart Docker Compose: `docker-compose down && docker-compose up --build`

### Issue 5: Order Takes Too Long

**Symptoms**: Order request times out or takes >30 seconds

**Solutions**:
1. Check RabbitMQ is running properly
2. View order service logs: `docker-compose logs order`
3. Ensure product IDs exist in the database

---

## Testing Checklist

Use this checklist to verify all functionality:

- [ ] **User Registration**: Can create new user account
- [ ] **User Login**: Can login and receive JWT token
- [ ] **Create Product**: Can create new products with authentication
- [ ] **List Products**: Can retrieve all products
- [ ] **Get Product by ID**: Can retrieve single product
- [ ] **Invalid Product ID**: Returns 400 for invalid ID format
- [ ] **Non-existent Product**: Returns 404 for non-existent product
- [ ] **Place Order**: Can create order with multiple products
- [ ] **Order Total**: Order total price is calculated correctly
- [ ] **Unauthorized Access**: Returns 401 without valid token

---

## Advanced Testing

### Testing Error Cases

#### Invalid Login Credentials
```json
POST /auth/login
{
  "username": "john_doe",
  "password": "wrongpassword"
}
```
**Expected**: 400 Bad Request

#### Duplicate Username
```json
POST /auth/register
{
  "username": "john_doe",
  "password": "password123"
}
```
**Expected**: 400 Bad Request (if user already exists)

#### Invalid Product Data
```json
POST /products/api/products
{
  "name": "",
  "price": -10
}
```
**Expected**: 400 Bad Request

---

## Performance Testing

### Load Testing with Postman

1. Create a Collection Runner
2. Set iterations to 100
3. Add delay of 100ms between requests
4. Run the collection
5. Analyze response times

### Expected Performance

- **Login**: < 200ms
- **Create Product**: < 300ms
- **Get Products**: < 200ms
- **Place Order**: < 5000ms (due to message queue)

---

## Automated Testing

The project includes automated tests that can be run with:

```bash
# Auth Service Tests
cd auth
npm test

# Product Service Tests
cd product
npm test
```

These tests are automatically run in the CI/CD pipeline on every push.

---

## Next Steps

After completing all tests:

1. ✅ Verify all endpoints work correctly
2. ✅ Document any issues found
3. ✅ Test edge cases and error scenarios
4. ✅ Perform load testing
5. ✅ Review CI/CD pipeline results

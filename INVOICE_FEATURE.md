# Invoice Feature Documentation

## Overview

The Invoice feature allows users to view order details in an invoice format. This feature uses the existing **Order model** from the order service - no separate invoice model is created. Orders are automatically created when users make purchases via the `/products/api/products/buy` endpoint.

## Architecture

```
Client
  │
  │ 1. First: Create order via /products/api/products/buy
  │ 2. Then: Get invoice via /products/api/products/invoice/:id
  ▼
Product Service
  │
  │ 1. Verify JWT token
  │ 2. Find order by ID
  │ 3. Populate product details
  │ 4. Format as invoice
  ▼
MongoDB (orders collection - shared with Order Service)
  │
  │ Order data retrieved
  ▼
Client receives invoice-formatted order details
```

## Endpoint

### Get Invoice by Order ID
**GET** `/products/api/products/invoice/:id`

Retrieves order details formatted as an invoice.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Example:**
```
GET /products/api/products/invoice/670fa12a9d1cbe45b91234f0
```

**Response:**
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

## Data Model

### Order Schema (Used for Invoices)

```javascript
{
  _id: ObjectId,
  user: String,              // Username of the customer
  products: [
    ObjectId                 // References to Product documents
  ],
  totalPrice: Number,        // Sum of all product prices
  status: String,            // 'pending', 'completed', 'cancelled'
  createdAt: Date            // Order/Invoice creation timestamp
}
```

**Note:** The Order model is shared between the Order Service and Product Service, both accessing the same `orders` collection in MongoDB.

## Implementation Files

### 1. Model
**File:** `product/src/models/order.js`

Copy of the Order schema from the Order Service, configured to access the same `orders` collection.

### 2. Controller
**File:** `product/src/controllers/productController.js`

Method:
- `getInvoiceById(req, res)` - Get order formatted as invoice by ID

### 3. Routes
**File:** `product/src/routes/productRoutes.js`

Defines the invoice endpoint at `/invoice/:id` within the products routes.

### 4. App Registration
**File:** `product/src/app.js`

Invoice route is part of `/api/products` routes.

## Testing with Postman

### Step 1: Login
```
POST /auth/login
{
  "username": "testuser",
  "password": "password123"
}
```
Save the JWT token.

### Step 2: Create Products
```
POST /products/api/products
Authorization: Bearer <token>
{
  "name": "Laptop",
  "price": 999.99,
  "description": "High-performance laptop"
}
```
Save the product IDs.

### Step 3: Place Order (Buy Products)
```
POST /products/api/products/buy
Authorization: Bearer <token>
{
  "ids": ["<product_id_1>", "<product_id_2>"]
}
```
This creates an order in the orders collection. The order is processed via RabbitMQ and saved by the Order Service.

### Step 4: Get Invoice by Order ID
Once the order is completed, you can retrieve it as an invoice:
```
GET /products/api/products/invoice/<order_id>
Authorization: Bearer <token>
```

**Note:** The order ID is not immediately available from the `/buy` endpoint response. You may need to check the orders collection or implement order tracking to get the order ID.

## Key Points

- **No Separate Invoice Model**: The invoice feature uses the existing Order model
- **Shared Database**: Both Product Service and Order Service access the same `orders` collection
- **Read-Only**: The invoice endpoint only reads order data, it doesn't create new records
- **Order Creation**: Orders are created via `/products/api/products/buy` and processed by the Order Service
- **Invoice Retrieval**: Orders can be retrieved in invoice format via `/products/api/products/invoice/:id`

## Security

All invoice endpoints require JWT authentication:

```javascript
Authorization: Bearer <jwt-token>
```

The middleware validates:
- Token presence
- Token signature
- Token expiration
- User information extraction

## Error Handling

### 401 Unauthorized
No token or invalid token provided.

### 404 Not Found
- Invoice ID doesn't exist
- No products found for given IDs

### 400 Bad Request
Invalid invoice ID format (not a valid MongoDB ObjectId).

### 500 Server Error
Database or server-side error.

## Best Practices

1. **Always validate product IDs** before creating invoices
2. **Store denormalized product data** to preserve historical prices
3. **Use transactions** for critical operations (future enhancement)
4. **Implement pagination** for large invoice lists (future enhancement)
5. **Add invoice number generation** for better tracking (future enhancement)

## Future Enhancements

### 1. Invoice Numbering
```javascript
invoiceNumber: "INV-2024-0001"
```

### 2. Tax Calculation
```javascript
subtotal: 1000.00,
tax: 100.00,
totalAmount: 1100.00
```

### 3. Payment Status
```javascript
paymentStatus: "paid" | "pending" | "failed"
paymentMethod: "credit_card" | "paypal" | "cash"
```

### 4. PDF Generation
Generate downloadable PDF invoices.

### 5. Email Notifications
Send invoice via email to customer.

### 6. Invoice Cancellation
```
DELETE /products/api/invoices/:id
```

### 7. Invoice Updates
```
PATCH /products/api/invoices/:id
```

## Database Queries

### Find invoices by user
```javascript
Invoice.find({ user: "testuser" })
```

### Find invoices by date range
```javascript
Invoice.find({
  createdAt: {
    $gte: new Date('2024-01-01'),
    $lte: new Date('2024-12-31')
  }
})
```

### Calculate total revenue
```javascript
Invoice.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: null, total: { $sum: '$totalAmount' } } }
])
```

## Troubleshooting

### Invoice not created
- Check if product IDs are valid
- Verify JWT token is correct
- Ensure MongoDB is running

### Invoice not found
- Verify invoice ID format (24-character hex string)
- Check if invoice exists in database
- Ensure you're using the correct invoice ID

### Total amount incorrect
- Verify product prices in database
- Check calculation logic in controller
- Ensure all products were found

## API Gateway Integration

All invoice requests go through the API Gateway:

```
Client → API Gateway (port 3003) → Product Service (port 3001)
```

Full URL examples:
- `http://localhost:3003/products/api/invoices`
- `http://localhost:3003/products/api/invoices/:id`

## Summary

The Invoice feature provides:
- ✅ Invoice creation with product details
- ✅ Invoice retrieval by ID
- ✅ List all invoices
- ✅ JWT authentication
- ✅ Proper error handling
- ✅ Denormalized product data for historical accuracy
- ✅ RESTful API design
- ✅ MongoDB persistence

This feature complements the existing order system and provides better record-keeping for billing and accounting purposes.

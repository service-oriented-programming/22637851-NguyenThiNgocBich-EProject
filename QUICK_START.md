# Quick Start Guide

Get the microservices sales system up and running in 5 minutes!

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- [Postman](https://www.postman.com/downloads/) (for API testing)

---

## Step 1: Start All Services (1 minute)

```bash
# Navigate to project directory
cd Term-Project

# Start all services with Docker Compose
docker-compose up --build
```

**Wait for**: All services to show "Server started" messages

---

## Step 2: Import Postman Collection (30 seconds)

1. Open Postman
2. Click **Import** button
3. Select `Postman_Collection.json`
4. Collection "Microservices Sales System" will appear

---

## Step 3: Test the APIs (3 minutes)

### A. Register a User

1. Open **Auth Service** → **[4] Register User**
2. Click **Send**
3. ✅ Should return 200 OK with user info

### B. Login

1. Open **Auth Service** → **[5] Login User**
2. Click **Send**
3. ✅ Token will be automatically saved to collection variables

### C. Create a Product

1. Open **Product Service** → **[6] Create Product**
2. Click **Send**
3. ✅ Should return 201 Created with product details
4. **Copy the `_id` from response**

### D. Get Product by ID

1. Open **Product Service** → **[8] Get Product by ID**
2. Replace `:id` in URL with the copied product ID
3. Click **Send**
4. ✅ Should return the product details

### E. Place an Order

1. Create 2-3 more products (repeat step C)
2. Copy all product IDs
3. Open **Product Service** → **[7] Place Order (Buy)**
4. Replace the IDs in the request body
5. Click **Send**
6. ✅ Should return completed order with total price

---

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f product
```

### Restart Services
```bash
docker-compose restart
```

### Stop Services
```bash
docker-compose down
```

### Clean Everything
```bash
docker-compose down -v
```

### Run Tests
```bash
# Auth service
cd auth && npm test

# Product service
cd product && npm test
```

---

## Service URLs

| Service | URL | Port |
|---------|-----|------|
| API Gateway | http://localhost:3003 | 3003 |
| Auth Service | http://localhost:3000 | 3000 |
| Product Service | http://localhost:3001 | 3001 |
| Order Service | http://localhost:3002 | 3002 |
| MongoDB | mongodb://localhost:37017 | 37017 |
| RabbitMQ Management | http://localhost:15672 | 15672 |

**Note**: Use API Gateway (port 3003) for all Postman requests.

---

## Quick Troubleshooting

### Services won't start
```bash
docker-compose down -v
docker-compose up --build
```

### Port already in use
```bash
# Stop conflicting services
docker-compose down

# Or change ports in docker-compose.yaml
```

### 401 Unauthorized
- Make sure you logged in first
- Token is automatically saved in Postman collection variables
- Check Authorization header: `Bearer <token>`

### Order takes too long
- Wait up to 10 seconds (RabbitMQ connection delay)
- Check RabbitMQ is running: `docker ps | grep rabbitmq`

---

## Next Steps

📖 **Read Full Documentation**:
- `API_ENDPOINTS.md` - Complete API reference
- `TESTING_GUIDE.md` - Detailed testing instructions
- `CI_CD_SETUP.md` - CI/CD pipeline guide
- `IMPLEMENTATION_SUMMARY.md` - Complete project overview

🚀 **Deploy to Production**:
- Configure environment variables
- Set up cloud hosting (AWS, Azure, GCP)
- Enable HTTPS
- Add monitoring and logging

---

## Need Help?

1. Check `TESTING_GUIDE.md` for detailed instructions
2. Review `API_ENDPOINTS.md` for API documentation
3. View logs: `docker-compose logs -f`
4. Check service status: `docker-compose ps`

---

**Happy Coding! 🎉**

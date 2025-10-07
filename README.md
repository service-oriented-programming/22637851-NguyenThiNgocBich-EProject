## Overview

This project is a microservices-based system designed for a service-oriented programming course term project. It consists of several independent services that communicate with each other, typically via HTTP and message brokers. The main services are:

- **API Gateway**: Entry point for all client requests, routes traffic to appropriate services.
- **Auth Service**: Handles user authentication, registration, and JWT token management.
- **Product Service**: Manages product catalog, CRUD operations for products.
- **Order Service**: Handles order creation, management, and user order history.

Each service is containerized with Docker and can be orchestrated using Docker Compose.

---

## Architecture & Flow

### 1. API Gateway
- Receives all external HTTP requests from clients (e.g., frontend, Postman).
- Forwards requests to the appropriate microservice (auth, product, order) based on the route.
- Handles basic request validation and may perform simple aggregations.

### 2. Auth Service
- Handles user registration and login.
- Issues JWT tokens upon successful authentication.
- Provides middleware to validate JWT tokens for protected routes in other services.

### 3. Product Service
- Manages product data (CRUD operations).
- Exposes endpoints for listing, creating, updating, and deleting products.
- Validates user authentication via JWT (using shared middleware or via API Gateway).

### 4. Order Service
- Handles order creation and management.
- Validates user authentication via JWT.
- May communicate with Product Service to validate product availability.

### 5. Shared Utilities
- Common authentication middleware and message broker utilities are shared between services (see `utils/`).

---

## Communication Flow

1. **User Registration/Login**
	- Client sends request to API Gateway `/auth/register` or `/auth/login`.
	- API Gateway forwards to Auth Service.
	- Auth Service processes and returns JWT token on success.

2. **Accessing Protected Resources**
	- Client includes JWT token in Authorization header.
	- API Gateway validates token (or forwards to service for validation).
	- Request is routed to Product or Order Service.
	- Service uses shared middleware to validate JWT and process request.

3. **Order Creation**
	- Client sends order request to API Gateway `/orders/create`.
	- API Gateway forwards to Order Service.
	- Order Service may check product availability via Product Service.
	- Order is created and response is sent back through the gateway.

---

## Project Structure

```
Term-Project/
├── api-gateway/
├── auth/
├── order/
├── product/
├── utils/
├── docker-compose.yaml
├── README.md
└── package.json
```

Each service contains its own `Dockerfile`, `package.json`, and `src/` directory with service-specific logic.

---

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (for local development/testing)

---

## Installation & Running the Project

### 1. Clone the Repository

```powershell
git clone <your-repo-url>
cd Term-Project
```

### 2. Environment Variables

Each service may require its own `.env` file. Example variables:

- `PORT`: Service port
- `JWT_SECRET`: Secret for JWT signing (Auth, Product, Order)
- `DB_URI`: Database connection string (if using a database)

Copy or create `.env` files in each service directory as needed.

### 3. Build and Start with Docker Compose

```powershell
docker-compose up --build
```

This will build and start all services in separate containers.

### 4. Accessing the Services

- **API Gateway**: http://localhost:3000 (or configured port)
- **Auth Service**: http://localhost:4000
- **Product Service**: http://localhost:5000
- **Order Service**: http://localhost:6000

All requests should go through the API Gateway.

---

## Development (Run Services Individually)

You can run each service locally for development:

```powershell
cd <service-folder>
npm install
npm start
```

---

## Testing

Some services include test files (see `src/test/`). Run tests with:

```powershell
npm test
```

---

## Extending the Project

- Add new services by creating a new folder with its own Dockerfile and package.json.
- Register new routes in the API Gateway.
- Share utilities via the `utils/` directory.

---

## Troubleshooting

- Ensure all `.env` files are present and correctly configured.
- Check Docker Compose logs for errors: `docker-compose logs`
- Make sure ports are not in use by other applications.

---

## License

MIT License
# CI/CD Setup Guide

This document explains the Continuous Integration and Continuous Deployment (CI/CD) setup for the microservices project.

## Overview

The project uses **GitHub Actions** for automated testing and Docker image building. The workflow is triggered on every push or pull request to the `main` or `master` branch.

## Workflow Structure

The CI/CD pipeline consists of 4 main jobs:

### 1. **test-auth-service**
- Runs tests for the Authentication Service
- Uses Node.js 18.x
- Installs dependencies and runs `npm test`

### 2. **test-product-service**
- Runs tests for the Product Service
- Uses Node.js 18.x
- Installs dependencies and runs `npm test`

### 3. **build-docker-images**
- Builds Docker images for all services
- Only runs after tests pass successfully
- Creates images for:
  - Auth Service
  - Product Service
  - Order Service
  - API Gateway

### 4. **docker-compose-test**
- Validates the Docker Compose configuration
- Ensures all services are properly configured

## Workflow File Location

```
.github/workflows/ci.yml
```

## How It Works

1. **Code Push/PR**: Developer pushes code or creates a pull request
2. **Checkout**: GitHub Actions checks out the code
3. **Test Phase**: Runs unit tests for auth and product services in parallel
4. **Build Phase**: If tests pass, builds Docker images for all services
5. **Validation**: Validates Docker Compose configuration

## Running Tests Locally

### Auth Service
```bash
cd auth
npm install
npm test
```

### Product Service
```bash
cd product
npm install
npm test
```

### Order Service
```bash
cd order
npm install
npm test
```

## Building Docker Images Locally

### Individual Services

```bash
# Auth Service
cd auth
docker build -t auth-service:latest .

# Product Service
cd product
docker build -t product-service:latest .

# Order Service
cd order
docker build -t order-service:latest .

# API Gateway
cd api-gateway
docker build -t api-gateway:latest .
```

### Using Docker Compose

```bash
# Build all services
docker-compose build

# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down
```

## Dockerfile Best Practices

All services use optimized Dockerfiles with:

1. **Multi-stage builds**: Uses `node:18-alpine` for smaller image size
2. **Layer caching**: Copies `package*.json` first for better caching
3. **Production dependencies**: Uses `npm install --production`
4. **Proper port exposure**: Each service exposes its designated port

## Environment Variables

Each service requires environment variables defined in `.env` files:

### Auth Service (.env)
```
PORT=3000
JWT_SECRET=your_jwt_secret
MONGO_URI=mongodb://mongo:27017/auth
```

### Product Service (.env)
```
PORT=3001
JWT_SECRET=your_jwt_secret
MONGO_URI=mongodb://mongo:27017/product
RABBITMQ_URL=amqp://rabbitmq:5672
```

### Order Service (.env)
```
PORT=3002
MONGO_URI=mongodb://mongo:27017/order
RABBITMQ_URL=amqp://rabbitmq:5672
```

## GitHub Actions Secrets

For production deployments, you may need to add secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password
   - `JWT_SECRET`: Production JWT secret

## Extending the CI/CD Pipeline

### Adding Docker Hub Push

To push images to Docker Hub, add this step to the workflow:

```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}

- name: Push Docker images
  run: |
    docker tag auth-service:latest ${{ secrets.DOCKER_USERNAME }}/auth-service:latest
    docker push ${{ secrets.DOCKER_USERNAME }}/auth-service:latest
```

### Adding Deployment

To deploy to a cloud provider (e.g., AWS, Azure, GCP):

```yaml
deploy:
  runs-on: ubuntu-latest
  needs: [build-docker-images]
  steps:
    - name: Deploy to Cloud
      run: |
        # Add deployment commands here
```

## Monitoring CI/CD

### Viewing Workflow Runs

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. View all workflow runs and their status

### Debugging Failed Builds

1. Click on the failed workflow run
2. Expand the failed job
3. Review the logs for error messages
4. Fix the issue and push again

## Best Practices

1. **Always run tests locally** before pushing
2. **Keep Docker images small** by using alpine variants
3. **Use environment variables** for configuration
4. **Never commit secrets** to the repository
5. **Tag Docker images** with version numbers for production
6. **Monitor build times** and optimize if necessary

## Troubleshooting

### Tests Failing in CI but Passing Locally

- Check Node.js version compatibility
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Docker Build Failures

- Check Dockerfile syntax
- Ensure all required files are present
- Verify base image availability

### Docker Compose Issues

- Validate YAML syntax
- Check service dependencies
- Ensure network configuration is correct

## Next Steps

1. **Add Integration Tests**: Test service-to-service communication
2. **Add Code Coverage**: Use tools like Istanbul/NYC
3. **Add Linting**: Use ESLint for code quality
4. **Add Security Scanning**: Use tools like Snyk or Trivy
5. **Add Performance Tests**: Use tools like Artillery or k6

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

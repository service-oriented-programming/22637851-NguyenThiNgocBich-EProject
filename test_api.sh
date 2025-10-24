#!/bin/bash
set -e

echo "Start check API Health..."

# Base URL
API_GATEWAY_URL="http://localhost:${API_GATEWAY_PORT:-3003}"

echo "Check API Gateway: $API_GATEWAY_URL/api/health"
if curl -s --fail "$API_GATEWAY_URL/api/health"; then
  echo "API Gateway is up and healthy!"
else
  echo "API Gateway is not healthy!"
  exit 1
fi

echo "Check Auth Service..."
if curl -s --fail "$API_GATEWAY_URL/api/auth/health"; then
  echo "Auth service is up and healthy!"
else
  echo "Auth service is not healthy!"
fi

echo "Check Product Service..."
if curl -s --fail "$API_GATEWAY_URL/api/products/health"; then
  echo "Product service is up and healthy!"
else
  echo "Product service is not healthy!"
fi

echo "Check Order Service..."
if curl -s --fail "$API_GATEWAY_URL/api/orders/health"; then
  echo "Order service is up and healthy!"
else
  echo "Order service is not healthy!"
fi

echo "All services are up and healthy!"

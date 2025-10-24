#!/bin/bash
set -e

echo "Start checking API Health..."

# Base URL of API Gateway
API_GATEWAY_URL="http://localhost:${API_GATEWAY_PORT:-3003}"

# Function to check 1 endpoint
check_health() {
  local name=$1
  local url=$2

  echo "Checking $name at $url"
  if curl -s --fail "$url" > /dev/null; then
    echo "$name is healthy!"
  else
    echo "$name is NOT healthy!"
    exit 1
  fi
}

# Call each service through API Gateway
check_health "API Gateway" "$API_GATEWAY_URL/api/health"
check_health "Auth Service" "$API_GATEWAY_URL/api/auth/health"
check_health "Product Service" "$API_GATEWAY_URL/api/products/health"
check_health "Order Service" "$API_GATEWAY_URL/api/orders/health"

echo "All services are UP and HEALTHY!"
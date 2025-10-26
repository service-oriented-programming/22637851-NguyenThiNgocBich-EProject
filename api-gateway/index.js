const express = require("express");
const httpProxy = require("http-proxy");
const axios = require("axios");

const proxy = httpProxy.createProxyServer();
const app = express();

const resolveServiceBaseUrl = (prefix, defaultHost, defaultPort) => {
  if (process.env[`${prefix}_URL`]) {
    return process.env[`${prefix}_URL`].replace(/\/$/, "");
  }

  const host = process.env[`${prefix}_HOST`] || defaultHost;
  const port = process.env[`${prefix}_PORT`] || defaultPort;

  return `http://${host}:${port}`;
};

const services = {
  auth: resolveServiceBaseUrl("AUTH_SERVICE", "auth-service", 3000),
  product: resolveServiceBaseUrl("PRODUCT_SERVICE", "product-service", 3001),
  order: resolveServiceBaseUrl("ORDER_SERVICE", "order-service", 3002),
};

const proxyToService = (serviceName) => (req, res) => {
  proxy.web(
    req,
    res,
    {
      target: services[serviceName],
      changeOrigin: true,
      autoRewrite: true,
    },
    (err) => {
      console.error(`Proxy error for ${serviceName}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ message: "Service temporarily unavailable" });
      }
    }
  );
};

proxy.on("error", (err, req, res) => {
  console.error("Global proxy error:", err.message);
  if (!res.headersSent) {
    res.status(502).json({ message: "Service temporarily unavailable" });
  }
});

app.use("/auth", proxyToService("auth"));
app.use("/products", proxyToService("product"));
app.use("/orders", proxyToService("order"));

// Healthcheck endpoint
app.get("/health", async (req, res) => {
  const upstreams = [
    { name: "auth", url: `${services.auth}/health` },
    { name: "product", url: `${services.product}/health` },
    { name: "order", url: `${services.order}/health` },
  ];

  const results = await Promise.all(
    upstreams.map(async ({ name, url }) => {
      try {
        await axios.get(url, { timeout: 5000 });
        return { name, status: "healthy" };
      } catch (err) {
        console.error(`Health check failed for ${name}:`, err.message);
        return { name, status: "unhealthy" };
      }
    })
  );

  const unhealthy = results.filter((service) => service.status !== "healthy");

  if (unhealthy.length > 0) {
    return res.status(502).json({ status: "unhealthy", services: results });
  }

  res.json({ status: "healthy", services: results });
});

const port = process.env.API_GATEWAY_PORT || 3003;
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
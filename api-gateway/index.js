const express = require("express");
const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer();
const app = express();

app.use("/auth", (req, res) => {
  proxy.web(req, res, {
    target: "http://auth:3000",
    changeOrigin: true,
    ignorePath: false,
  });
});

app.use("/products", (req, res) => {
  proxy.web(req, res, {
    target: "http://product:3001",
    changeOrigin: true,
    ignorePath: false,
  });
});

app.use("/orders", (req, res) => {
  proxy.web(req, res, {
    target: "http://order:3002",
    changeOrigin: true,
    ignorePath: false,
  });
});

// Healthcheck endpoint
app.get("/health", async (req, res) => {
  const services = [
    { name: "auth", url: "http://auth:3000/health" },
    { name: "product", url: "http://product:3001/health" },
  ];

  const results = await Promise.all(
    services.map(async (s) => {
      try {
        await axios.get(s.url);
        return { [s.name]: "healthy" };
      } catch (err) {
        return { [s.name]: "unhealthy" };
      }
    })
  );

  const unhealthy = results.filter(r => Object.values(r)[0] === "unhealthy");
  if (unhealthy.length > 0) {
    return res.status(500).json({ status: "unhealthy", details: results });
  }

  res.json({ status: "healthy", details: results });
});

const port = process.env.API_GATEWAY_PORT || 3003;
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
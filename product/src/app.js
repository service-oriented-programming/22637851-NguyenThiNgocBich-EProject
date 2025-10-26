const express = require("express");
const mongoose = require("mongoose");
const config = require("./config");
const MessageBroker = require("./utils/messageBroker");
const productsRouter = require("./routes/productRoutes");
require("dotenv").config();

class App {
  constructor() {
    this.app = express();
    this.registerHealthCheck();
    this.connectDB();
    this.setMiddlewares();
    this.setRoutes();
    this.setupMessageBroker();
  }

  async connectDB() {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB [${config.mongoURI}] connected`);
  }

  async disconnectDB() {
    await mongoose.disconnect();
    console.log(`MongoDB [${config.mongoURI}] disconnected`);
  }

  setMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  registerHealthCheck() {
    this.app.get("/health", (req, res) => {
      const mongoConnected = mongoose.connection.readyState === 1;
      res.status(mongoConnected ? 200 : 503).json({
        status: mongoConnected ? "ok" : "degraded",
        mongoConnected,
      });
    });
  }

  setRoutes() {
    this.app.use("/api/products", productsRouter);
  }

  setupMessageBroker() {
    if (process.env.DISABLE_BROKER === "true" || process.env.NODE_ENV === "test") {
      console.log("Message broker disabled for current environment");
      return;
    }

    MessageBroker.connect();
  }

  start() {
    this.server = this.app.listen(config.port, () =>
      console.log(`Server started on port ${config.port}`)
    );
  }

  async stop() {
    await mongoose.disconnect();
    this.server.close();
    console.log(`Server stopped on port ${config.port}`);
  }
}

module.exports = App;
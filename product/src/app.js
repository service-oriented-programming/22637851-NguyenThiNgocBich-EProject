const express = require("express");
const mongoose = require("mongoose");
const config = require("./config");
const MessageBroker = require("./utils/messageBroker");
const productsRouter = require("./routes/productRoutes");
require("dotenv").config();

class App {
  constructor() {
    this.app = express();
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

  setRoutes() {
    this.app.use("/api/products", productsRouter);
  }

  setupMessageBroker() {
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
const express = require("express");
const mongoose = require("mongoose");
const Order = require("./models/order");
const amqp = require("amqplib");
const config = require("./config");

class App {
  constructor() {
    this.app = express();
    this.registerHealthCheck();
    this.connectDB();
    this.setMiddlewares();
    this.setupOrderConsumer();
  }

  async connectDB() {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  }

  async disconnectDB() {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }

  setMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  registerHealthCheck() {
    this.app.get("/health", (req, res) => {
      const mongoConnected = mongoose.connection.readyState === 1;
      const healthy = mongoConnected;

      res.status(healthy ? 200 : 503).json({
        status: healthy ? "ok" : "degraded",
        mongoConnected,
      });
    });
  }

  async setupOrderConsumer() {
    if (process.env.DISABLE_CONSUMER === "true" || process.env.NODE_ENV === "test") {
      console.log("Order consumer disabled for current environment");
      return;
    }

    console.log("Connecting to RabbitMQ...");

    const connectWithRetry = async (attempt = 1) => {
      try {
        const amqpServer = process.env.RABBITMQ_URI || "amqp://rabbitmq:5672";
        const connection = await amqp.connect(amqpServer);
        console.log("Connected to RabbitMQ");
        const channel = await connection.createChannel();
        await channel.assertQueue("orders");

        channel.consume("orders", async (data) => {
          console.log("Consuming ORDER service");
          const { products, username, orderId } = JSON.parse(data.content);

          const newOrder = new Order({
            products,
            user: username,
            totalPrice: products.reduce((acc, product) => acc + product.price, 0),
          });

          await newOrder.save();

          channel.ack(data);
          console.log("Order saved to DB and ACK sent to ORDER queue");

          const { user, products: savedProducts, totalPrice } = newOrder.toJSON();
          channel.sendToQueue(
            "products",
            Buffer.from(JSON.stringify({ orderId, user, products: savedProducts, totalPrice }))
          );
        });

        connection.on("close", () => {
          console.warn("RabbitMQ connection closed. Reconnecting...");
          setTimeout(() => connectWithRetry(), 5000);
        });

        connection.on("error", (err) => {
          console.error("RabbitMQ connection error:", err.message);
        });
      } catch (err) {
        const delay = Math.min(30000, 5000 * attempt);
        console.error(`Failed to connect to RabbitMQ (attempt ${attempt}):`, err.message);
        console.log(`Retrying in ${delay / 1000}s...`);
        setTimeout(() => connectWithRetry(attempt + 1), delay);
      }
    };

    connectWithRetry();
  }

  start() {
    this.server = this.app.listen(config.port, () =>
      console.log(`Server started on port ${config.port}`)
    );
  }

  async stop() {
    await mongoose.disconnect();
    this.server.close();
    console.log("Server stopped");
  }
}

module.exports = App;

const express = require("express");
const mongoose = require("mongoose");
const config = require("./config");
const authMiddleware = require("./middlewares/authMiddleware");
const AuthController = require("./controllers/authController");

class App {
  constructor() {
    this.app = express();
    this.authController = new AuthController();
    this.dbConnected = false;
    this.connectDB();
    this.setMiddlewares();
    this.setRoutes();
  }

  async connectDB() {
    try {
      await mongoose.connect(config.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      this.dbConnected = true;
      console.log("MongoDB connected");
    } catch (error) {
      console.error("MongoDB connection error:", error.message);
      this.dbConnected = false;
    }
  }

  async disconnectDB() {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }

  setMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  setRoutes() {
    this.app.post("/login", (req, res) => this.authController.login(req, res));
    this.app.post("/register", (req, res) => this.authController.register(req, res));
    this.app.get("/dashboard", authMiddleware, (req, res) => res.json({ message: "Welcome to dashboard" }));
    this.app.get('/health', (req, res) => {
      const mongoConnected = mongoose.connection.readyState === 1;
      const healthy = mongoConnected;
      
      res.status(healthy ? 200 : 503).json({
        status: healthy ? 'ok' : 'degraded',
        mongoConnected
      });
    });
  }

  start() {
    this.server = this.app.listen(config.port, () => console.log(`Server started on port ${config.port}`));
  }

  async stop() {
    await mongoose.disconnect();
    this.server.close();
    console.log("Server stopped");
  }
}

module.exports = App;
const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const App = require("../app");
const messageBroker = require("../utils/messageBroker");
const expect = chai.expect;
require("dotenv").config();

chai.use(chaiHttp);

describe("Product & Order Integration Flow", () => {
  let app;
  let authToken;
  let createdProductId;
  let createdOrderId;
  let brokerPublishStub, brokerConsumeStub;

  before(async () => {
    // Test environment
    process.env.DISABLE_BROKER = "true";
    process.env.NODE_ENV = "test";

    // Mock messageBroker to avoid connecting to RabbitMQ
    brokerPublishStub = sinon.stub(messageBroker, "publishMessage").callsFake(async (queue, data) => {
      // Simulate immediate response like RabbitMQ sends to 'products' queue
      setTimeout(() => {
        messageBroker._mockConsumer &&
          messageBroker._mockConsumer({
            orderId: data.orderId,
            totalPrice: data.products.reduce((acc, p) => acc + (p.price || 0), 0),
            status: "completed",
          });
      }, 100);
    });

    brokerConsumeStub = sinon.stub(messageBroker, "consumeMessage").callsFake((queue, callback) => {
      // Save callback to use when mock publish
      messageBroker._mockConsumer = callback;
    });

    // Start app
    app = new App();
    await app.connectDB();

    // Create JWT to bypass middleware
    const jwt = require("jsonwebtoken");
    const testUser = { username: "testuser", _id: "test123" };
    authToken = jwt.sign(testUser, process.env.JWT_SECRET || "test-secret", { expiresIn: "1h" });

    app.start();
  });

  after(async () => {
    await app.disconnectDB();
    app.stop();
    sinon.restore(); 
  });

  // STEP 1 - Create Product
  describe("POST /api/products", () => {
    it("should create a new product and return its _id", async () => {
      const product = {
        name: "iPhone 16 Ultra",
        description: "Newest model for testing",
        price: 2500,
      };

      const res = await chai
        .request(app.app)
        .post("/api/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send(product);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("_id");
      expect(res.body).to.have.property("name", product.name);
      createdProductId = res.body._id;
    });
  });

  // STEP 2 - Create Order with `ids` array
  describe("POST /api/products/buy", () => {
    it("should create order successfully with 'ids' array", async () => {
      const payload = {
        ids: [createdProductId], // mapping correct with controller
      };

      const res = await chai
        .request(app.app)
        .post("/api/products/buy")
        .set("Authorization", `Bearer ${authToken}`)
        .send(payload);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("status", "completed");
      expect(res.body).to.have.property("products").that.is.an("array");
      expect(res.body.products[0]).to.have.property("_id", createdProductId);

      createdOrderId = res.body.orderId;
    });

    it("should return 400 if no ids provided", async () => {
      const res = await chai
        .request(app.app)
        .post("/api/products/buy")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ids: [] });

      expect(res).to.have.status(500);
    });
  });

  // STEP 3️ - Get invoice by orderId
  describe("GET /api/products/invoice/:orderId", () => {
    it("should get invoice details for created order", async () => {
      const res = await chai
        .request(app.app)
        .get(`/api/products/invoice/${createdOrderId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("orderId", createdOrderId);
      expect(res.body).to.have.property("products").that.is.an("array");
      expect(res.body).to.have.property("status", "completed");
    });

    it("should return 404 for invalid orderId", async () => {
      const res = await chai
        .request(app.app)
        .get(`/api/products/invoice/invalidOrderId`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res).to.have.status(404);
    });
  });
});
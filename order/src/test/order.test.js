const chai = require("chai");
const chaiHttp = require("chai-http");
const App = require("../app");
const expect = chai.expect;
require("dotenv").config();

chai.use(chaiHttp);

describe("Order Service", () => {
  let app;

  before(async () => {
    // Disable RabbitMQ consumer for testing
    process.env.DISABLE_CONSUMER = "true";
    process.env.NODE_ENV = "test";
    
    app = new App();
    await app.connectDB();
    app.start();
  });

  after(async () => {
    await app.disconnectDB();
    app.stop();
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const res = await chai
        .request(app.app)
        .get("/health");

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("status");
      expect(res.body.status).to.be.oneOf(["ok", "degraded"]);
    });

    it("should report MongoDB connection status", async () => {
      const res = await chai
        .request(app.app)
        .get("/health");

      expect(res.body).to.have.property("mongoConnected");
      expect(res.body.mongoConnected).to.be.a("boolean");
    });
  });
});

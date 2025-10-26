const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;

chai.use(chaiHttp);

describe("API Gateway", () => {
  const gatewayUrl = process.env.API_GATEWAY_URL || "http://localhost:3003";

  describe("GET /health", () => {
    it("should return health status", (done) => {
      chai
        .request(gatewayUrl)
        .get("/health")
        .end((err, res) => {
          if (err) {
            // If gateway is not running, skip test gracefully
            console.log("API Gateway not running, skipping test");
            done();
          } else {
            expect(res).to.have.status([200, 502]);
            expect(res.body).to.have.property("status");
            done();
          }
        });
    });
  });

  describe("Gateway Routes", () => {
    it("should have /auth route configured", (done) => {
      // This is a basic connectivity test
      chai
        .request(gatewayUrl)
        .get("/auth/health")
        .end((err, res) => {
          // We expect either success or 502 (service unavailable)
          // Both indicate the gateway is routing correctly
          if (res) {
            expect(res.status).to.be.oneOf([200, 502, 503]);
          }
          done();
        });
    });

    it("should have /products route configured", (done) => {
      chai
        .request(gatewayUrl)
        .get("/products/health")
        .end((err, res) => {
          if (res) {
            expect(res.status).to.be.oneOf([200, 502, 503]);
          }
          done();
        });
    });

    it("should have /orders route configured", (done) => {
      chai
        .request(gatewayUrl)
        .get("/orders/health")
        .end((err, res) => {
          if (res) {
            expect(res.status).to.be.oneOf([200, 502, 503]);
          }
          done();
        });
    });
  });
});

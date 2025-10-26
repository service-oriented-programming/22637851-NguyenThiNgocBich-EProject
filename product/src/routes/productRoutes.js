const express = require("express");
const ProductController = require("../controllers/productController");
const isAuthenticated = require("../utils/isAuthenticated");

const router = express.Router();
const productController = new ProductController();

router.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

router.post("/", isAuthenticated, productController.createProduct);
router.post("/buy", isAuthenticated, productController.createOrder);
router.get("/", isAuthenticated, productController.getProducts);
router.get("/invoice/:orderId", isAuthenticated, productController.getInvoiceByOrderId);

module.exports = router;
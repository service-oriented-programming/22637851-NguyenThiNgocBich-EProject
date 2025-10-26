const Product = require("../models/product");
const messageBroker = require("../utils/messageBroker");
const uuid = require('uuid');

/**
 * Class to hold the API implementation for the product services
 */
class ProductController {

  constructor() {
    this.createOrder = this.createOrder.bind(this);
    this.getOrderStatus = this.getOrderStatus.bind(this);
    this.getInvoiceByOrderId = this.getInvoiceByOrderId.bind(this);
    this.ordersMap = new Map();
  }

  async createProduct(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const product = new Product(req.body);

      const validationError = product.validateSync();
      if (validationError) {
        return res.status(400).json({ message: validationError.message });
      }

      await product.save({ timeout: 30000 });

      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

  async createOrder(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const { ids } = req.body;
      const products = await Product.find({ _id: { $in: ids } });
  
      const orderId = uuid.v4();
      this.ordersMap.set(orderId, { 
        status: "pending", 
        products, 
        username: req.user.username
      });
  
      await messageBroker.publishMessage("orders", {
        products,
        username: req.user.username,
        orderId,
      });

      messageBroker.consumeMessage("products", (data) => {
        const orderData = JSON.parse(JSON.stringify(data));
        const { orderId } = orderData;
        let order = this.ordersMap.get(orderId);
        if (order) {
          const originalProducts = order.products;
          order = {
            ...order,
            ...orderData,
            products: originalProducts,
            status: "completed",
          };
          this.ordersMap.set(orderId, order);
          console.log("Updated order:", order);
        }
      });
  
      let order = this.ordersMap.get(orderId);
      while (order.status !== "completed") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        order = this.ordersMap.get(orderId);
      }
  
      return res.status(201).json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

  async getOrderStatus(req, res, next) {
    const { orderId } = req.params;
    const order = this.ordersMap.get(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json(order);
  }

  async getProducts(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const products = await Product.find({});

      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

  async getInvoiceByOrderId(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { orderId } = req.params;
      console.log("orderId", orderId);

      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const order = this.ordersMap.get(orderId);
      console.log("order", order);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status !== "completed") {
        return res.status(400).json({
          message: "Order is not completed yet",
          status: order.status,
        });
      }

      const invoice = {
        orderId,
        username: order.username || order.user,
        products: order.products.map((product) => ({
          id: product._id,
          name: product.name,
          price: product.price,
          description: product.description,
        })),
        totalPrice: order.totalPrice,
        createdAt: order.createdAt || new Date().toISOString(),
        status: order.status,
      };

      res.status(200).json(invoice);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = ProductController;
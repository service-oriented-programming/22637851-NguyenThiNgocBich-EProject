require('dotenv').config();

module.exports = {
    mongoURI: process.env.MONGODB_ORDER_URI,
    rabbitMQURI: process.env.RABBITMQ_URI,
    rabbitMQQueue: 'orders',
    port: process.env.ORDER_PORT || 3002,
};
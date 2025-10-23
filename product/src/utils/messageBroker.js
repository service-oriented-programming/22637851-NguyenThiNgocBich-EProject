const amqp = require("amqplib");
const { RABBITMQ_URI } = process.env;

class MessageBroker {
  constructor() {
    this.channel = null;
  }

  async connect() {
    console.log(`Connecting to RabbitMQ [${RABBITMQ_URI}]`);

    setTimeout(async () => {
      try {
        const connection = await amqp.connect(RABBITMQ_URI);
        this.channel = await connection.createChannel();
        await this.channel.assertQueue("products");
        console.log(`RabbitMQ connected [${RABBITMQ_URI}]`);
      } catch (err) {
        console.error(`Failed to connect to RabbitMQ [${RABBITMQ_URI}]:`, err.message);
      }
    }, 20000); // delay 10 seconds to wait for RabbitMQ to start
  }

  async publishMessage(queue, message) {
    if (!this.channel) {
      console.error(`No RabbitMQ channel available [${RABBITMQ_URI}].`);
      return;
    }

    try {
      await this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message))
      );
    } catch (err) {
      console.error(`Failed to publish message [${RABBITMQ_URI}]:`, err.message);
    }
  }

  async consumeMessage(queue, callback) {
    if (!this.channel) {
      console.error(`No RabbitMQ channel available [${RABBITMQ_URI}].`);
      return;
    }

    try {
      await this.channel.consume(queue, (message) => {
        const content = message.content.toString();
        const parsedContent = JSON.parse(content);
        callback(parsedContent);
        this.channel.ack(message);
      });
    } catch (err) {
      console.error(`Failed to consume message [${RABBITMQ_URI}]:`, err.message);
    }
  }
}

module.exports = new MessageBroker();
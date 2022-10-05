require("dotenv").config();
import { Connection, Channel, ConsumeMessage, connect } from "amqplib";

let connection: Connection;

export const RabbitMQConnection = async (): Promise<Connection> => {
  if (connection) {
    return connection;
  }

  const endPoint = process.env.RABBITMQ_HOST;
  const accessKey = process.env.RABBITMQ_USER;
  const secretKey = process.env.RABBITMQ_PASS;
  console.log("Setting up RabbitMQ Connection :::", endPoint, accessKey, secretKey);

  connection = await connect("amqp://" + accessKey + ":" + secretKey + "@" + endPoint);
  return connection;
};

export const RabbitMQAudibleChannel = (): string => {
  return process.env.RABBITMQ_AUDIBLE_CHANNEL;
};

require('dotenv').config();
import { Connection, Channel, ConsumeMessage, connect } from 'amqplib';
import { APILogger } from '../logger/api.logger';

let connection: Connection;
let logger: APILogger;

export const RabbitMQConnection = async (): Promise<Connection> => {
  if (connection) {
    return connection;
  }
  logger = new APILogger();

  if (!process.env.RABBITMQ_HOST) {
    throw new Error('RABBITMQ_HOST is not defined');
  }
  if (!process.env.RABBITMQ_USER) {
    throw new Error('RABBITMQ_USER is not defined');
  }
  if (!process.env.RABBITMQ_PASS) {
    throw new Error('RABBITMQ_PASS is not defined');
  }

  const endPoint = process.env.RABBITMQ_HOST;
  const accessKey = process.env.RABBITMQ_USER;
  const secretKey = process.env.RABBITMQ_PASS;
  logger.info('Setting up RabbitMQ Connection :::', endPoint, accessKey, secretKey);

  connection = await connect('amqp://' + accessKey + ':' + secretKey + '@' + endPoint);
  return connection;
};

export const GetChannel = async (): Promise<Channel> => {
  return new Promise(async (resolve, reject) => {
    RabbitMQConnection().then((connection) => {
      connection.createChannel().then(async (channel) => {
        await channel.assertQueue(RabbitMQAudibleChannel(), { durable: false });
        resolve(channel);
      });
    });
  });
};

export const RabbitMQAudibleChannel = (): string => {
  if (!process.env.RABBITMQ_AUDIBLE_CHANNEL) {
    throw new Error('RABBITMQ_AUDIBLE_CHANNEL is not defined');
  }
  return process.env.RABBITMQ_AUDIBLE_CHANNEL;
};

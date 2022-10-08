import { RabbitMQConnection, RabbitMQAudibleChannel } from '../config/rabbitmq.config';
import { APILogger } from '../logger/api.logger';
const logger = new APILogger();

export const sendDownloadBook = async (url: string, force?: boolean): Promise<void> => {
  logger.debug('Sending download book request: ', url);
  RabbitMQConnection().then((connection) => {
    connection.createChannel().then(async (channel) => {
      //await channel.assertQueue(RabbitMQAudibleChannel());
      channel.sendToQueue(
        RabbitMQAudibleChannel(),
        Buffer.from(
          JSON.stringify({
            url: url,
            type: 'book',
            force: force ? true : false,
          })
        )
      );
    });
  });
};

export const sendDownloadSeries = async (url: string, force?: boolean): Promise<void> => {
  logger.debug('Sending download series request: ', url);
  RabbitMQConnection().then((connection) => {
    connection.createChannel().then(async (channel) => {
      //await channel.assertQueue(RabbitMQAudibleChannel());
      channel.sendToQueue(
        RabbitMQAudibleChannel(),
        Buffer.from(
          JSON.stringify({
            url: url,
            type: 'series',
            force: force ? true : false,
          })
        )
      );
    });
  });
};
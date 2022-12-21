import { RabbitMQConnection, RabbitMQAudibleChannel } from '../config/rabbitmq.config';
import { APILogger } from '../logger/api.logger';
const logger = new APILogger('Queue');

export const sendDownloadBook = async (asin: string, jobId: number | null, userId: number, addToUser: boolean, force?: boolean): Promise<void> => {
  logger.debug('Sending download book request: ' + asin);
  RabbitMQConnection().then((connection) => {
    connection.createChannel().then(async (channel) => {
      //await channel.assertQueue(RabbitMQAudibleChannel());
      channel.sendToQueue(
        RabbitMQAudibleChannel(),
        Buffer.from(
          JSON.stringify({
            asin: asin,
            type: 'book',
            jobId: jobId ? jobId : null,
            userId: userId ? userId : null,
            addToUser: addToUser ? addToUser : false,
            force: force ? true : false,
          })
        )
      );
    });
  });
};

export const sendDownloadSeries = async (asin: string, jobId: number | null, userId?: number, force?: boolean): Promise<void> => {
  logger.debug('Sending download series request: ' + asin);
  RabbitMQConnection().then((connection) => {
    connection.createChannel().then(async (channel) => {
      //await channel.assertQueue(RabbitMQAudibleChannel());
      channel.sendToQueue(
        RabbitMQAudibleChannel(),
        Buffer.from(
          JSON.stringify({
            asin: asin,
            type: 'series',
            jobId: jobId ? jobId : null,
            userId: userId ? userId : null,
            force: force ? true : false,
          })
        )
      );
    });
  });
};

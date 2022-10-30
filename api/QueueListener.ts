import { APILogger } from './logger/api.logger';
import { RabbitMQConnection, RabbitMQAudibleChannel, RabbitMQCheck } from './config/rabbitmq.config';
import { AudibleManagementService, RetryableError } from './service/audible_management.service';
import { UserService } from './service/dal/user';
import { Download } from './config/download.config';
import { delay } from './util/Async.util';
import * as Queue from './util/Queue.util';

const waitTime = 0;

export const QueueListener = async (index: number): Promise<void> => {
  const logger = new APILogger('QueueListener');
  logger.info('Starting queue listener');
  const userService = new UserService();

  let downloadService = await Download();
  let audibleManagementService = new AudibleManagementService(downloadService);
  let connection = await RabbitMQConnection();
  let channel = await connection.createChannel();
  channel.assertQueue(RabbitMQAudibleChannel(), { durable: false });
  channel.prefetch(1);

  let lastProcessingTime = 0;
  logger.info('Message listener started on queue "' + RabbitMQAudibleChannel() + '"');

  while (true) {
    let start = Date.now();
    try {
      let message = await channel.get(RabbitMQAudibleChannel());
      if (!message) {
        await delay(1000);
        continue;
      }

      lastProcessingTime = new Date().getTime();
      let data = message.content.toString();
      logger.trace('Message received: ' + JSON.stringify(data));
      let obj;
      try {
        obj = JSON.parse(data);
      } catch (error) {
        logger.error('Failed to parse message');
        channel.ack(message);
        continue;
      }

      let url = obj.url?.split('?')[0];
      let userId = obj.userId ? obj.userId : null;
      let addToUser = obj.addToUser ? obj.addToUser : false;

      let hitAudibleUrl = false;
      try {
        if (obj.type === 'book') {
          logger.info('Processing book download request: ' + url);
          hitAudibleUrl = await audibleManagementService.downloadBook(url, userId, addToUser, obj.force);
        } else if (obj.type == 'series') {
          logger.info('Processing series download request: ' + url);
          hitAudibleUrl = await audibleManagementService.downloadSeries(url, userId, obj.force);
        } else {
          logger.error('Unknown message type');
        }
      } catch (error) {
        if (error instanceof RetryableError) {
          logger.error('Processing failed, retrying: ' + error.message);
          channel.nack(message);
          continue;
        }

        logger.error('Failed to download, will not retry: ' + error.message);
        console.log('Error: ', error);
      }
      if (obj.jobId) {
        await userService.finishJob(obj.jobId);
      }
      channel.ack(message);

      // if (hitAudibleUrl) {
      //   let timePassed = new Date().getTime() - lastProcessingTime;
      //   logger.trace('Calculated wait time is ' + (waitTime - timePassed) + ' ms');

      //   if (timePassed < waitTime) {
      //     logger.trace('Hit audible url, waiting for 2 seconds');
      //     await delay(waitTime - timePassed);
      //   } else {
      //     logger.trace("Execution took longer then waitime, don't wait");
      //   }
      // } else {
      //   logger.trace("Didn't hit audible url, no need to wait");
      // }

      let timePassed = new Date().getTime() - start;
      logger.debug('Message processed in ' + timePassed + ' ms');
    } catch (error) {
      logger.error('Failed to process message: ' + error.message);
    }
  }
};

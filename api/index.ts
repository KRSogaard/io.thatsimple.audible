import * as http from 'http';
import App from './app';
import { APILogger } from './logger/api.logger';
import { RabbitMQConnection, RabbitMQAudibleChannel, RabbitMQCheck } from './config/rabbitmq.config';
import { AudibleManagementService } from './service/audible_management.service';
import { AudibleUserService } from './service/user.service';
import { MySQLConnection, MySQLCheck } from './config/mysql.config';
import { MinIOCheck } from './config/minio.config';
require('dotenv').config();

// HERE FOR FAST FAILS
MinIOCheck();
MySQLCheck();
RabbitMQCheck();

const port = process.env.PORT || 3080;
const waitTime = 2000;

App.set('port', port);
const server = http.createServer(App);
server.listen(port);

const logger = new APILogger();
const audibleManagementService = new AudibleManagementService();
const userService = new AudibleUserService();

logger.info('Creating database connection');
MySQLConnection();

server.on('listening', function (): void {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`Listening on ` + bind);
});

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

let lastProcessingTime = 0;

RabbitMQConnection().then((connection) => {
  connection.createChannel().then(async (channel) => {
    channel.assertQueue(RabbitMQAudibleChannel(), { durable: false });
    channel.prefetch(1);
    logger.info('Message listener started on queue "' + RabbitMQAudibleChannel() + '"');
    while (true) {
      try {
        let message = await channel.get(RabbitMQAudibleChannel());
        if (!message) {
          await delay(1000);
          continue;
        }
        lastProcessingTime = new Date().getTime();
        let data = message.content.toString();
        logger.trace('Message received', data);
        let obj;
        try {
          obj = JSON.parse(data);
        } catch (error) {
          logger.error('Failed to parse message', null);
          channel.ack(message);
          continue;
        }

        let url = obj.url?.split('?')[0];
        let userId = obj.userId ? obj.userId : null;
        let addToUser = obj.addToUser ? obj.addToUser : false;

        let hitAudibleUrl = false;
        try {
          if (obj.type === 'book') {
            logger.info('Processing book download request', url);
            hitAudibleUrl = await audibleManagementService.downloadBook(url, userId, addToUser, obj.force);
          } else if (obj.type == 'series') {
            logger.info('Processing series download request', url);
            hitAudibleUrl = await audibleManagementService.downloadSeries(url, userId, obj.force);
          } else {
            logger.error('Unknown message type');
          }
        } catch (error) {
          logger.error('Failed to download, will not retry', error);
        } finally {
          channel.ack(message);
          if (obj.jobId) {
            await userService.finishJob(obj.jobId);
          }
        }

        if (hitAudibleUrl) {
          let timePassed = new Date().getTime() - lastProcessingTime;
          logger.trace('Calculated wait time is ' + (waitTime - timePassed) + ' ms');

          if (timePassed < waitTime) {
            logger.trace('Hit audible url, waiting for 2 seconds');
            await delay(waitTime - timePassed);
          } else {
            logger.trace("Execution took longer then waitime, don't wait");
          }
        } else {
          logger.trace("Didn't hit audible url, no need to wait");
        }
      } catch (error) {
        logger.error('Failed to process message', error);
      }
    }
  });
});

module.exports = App;

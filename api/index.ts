import * as http from 'http';
import App from './app';
import { APILogger } from './logger/api.logger';
import { RabbitMQCheck } from './config/rabbitmq.config';
import { MySQLConnection, MySQLCheck } from './config/mysql.config';
import { MinIOCheck } from './config/minio.config';
import { QueueListener } from './QueueListener';
import { SeriesRefresh } from './SeriesRefresh';
require('dotenv').config();

// HERE FOR FAST FAILS
MinIOCheck();
MySQLCheck();
RabbitMQCheck();

// Lets open the connection
MySQLConnection();

const workersOnly = process.env.WORKERS_ONLY;

const logger = new APILogger('Root');

// Download().then(async (download) => {
//   for (let i = 0; i < 100; i++) {
//     try {
//       let image = await download.downloadImage('https://m.media-amazon.com/images/I/51+EyQja6PL._SL500_.jpg');
//       console.log('Image: ', image.length);
//     } catch (error) {
//       if (error instanceof RetryableError) {
//         console.log('Retryable error:', error);
//         await delay(10000);
//       } else {
//         console.log('Fatal error:', error);
//         throw error;
//       }
//     }
//   }
// });

if (!workersOnly) {
  const port = process.env.PORT || 3080;

  App.set('port', port);
  const server = http.createServer(App);
  server.listen(port);

  server.on('listening', function (): void {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    logger.info(`Listening on ` + bind);
  });
} else {
  logger.info('Workers only mode');
}

QueueListener(1);
SeriesRefresh();

module.exports = App;

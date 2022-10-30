import * as http from 'http';
import App from './app';
import { APILogger } from './logger/api.logger';
import { RabbitMQCheck } from './config/rabbitmq.config';
import { MySQLConnection, MySQLCheck } from './config/mysql.config';
import { MinIOCheck } from './config/minio.config';
import { QueueListener } from './QueueListener';
import { SeriesRefresh } from './SeriesRefresh';
import { Download } from './config/download.config';
import AudibleManagementService from './service/audible_management.service';
require('dotenv').config();

const runApp = async (): Promise<void> => {
  try {
    // HERE FOR FAST FAILS
    MinIOCheck();
    MySQLCheck();
    RabbitMQCheck();

    // Lets open the connection
    await MySQLConnection();

    const workersOnly = process.env.WORKERS_ONLY;

    const logger = new APILogger('Root');

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
  } catch (error) {
    console.log('Fatal error:', error);
  }
};

runApp();

module.exports = App;

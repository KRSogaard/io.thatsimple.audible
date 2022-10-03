const pine = require("pine");

const logger = pine();

export class APILogger {
  info(message: string, data?: any) {
    if (data) {
      logger.info(`${message} (${JSON.stringify(data)})`);
    } else {
      logger.info(message);
    }
  }

  debug(message: string, data?: any) {
    if (data) {
      logger.debug(`${message} (${JSON.stringify(data)})`);
    } else {
      logger.debug(message);
    }
  }

  error(message: string) {
    logger.error(message);
  }
}

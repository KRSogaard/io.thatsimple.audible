import * as pino from 'pino';
// const pretty = require("pino-pretty");
// const logger = pino(pretty());

const logger = pino.default({
  level: 'trace',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: true,
    },
  },
});

export class APILogger {
  info(message: string, ...data: any[]) {
    if (data) {
      logger.info({ ...data }, message);
    } else {
      logger.info(message);
    }
  }

  debug(message: string, ...data: any[]) {
    if (data) {
      logger.debug({ ...data }, message);
    } else {
      logger.debug(message);
    }
  }

  trace(message: string, ...data: any[]) {
    if (data) {
      logger.trace({ ...data }, message);
    } else {
      logger.trace(message);
    }
  }

  warn(message: string, ...data: any[]) {
    if (data) {
      logger.warn({ ...data }, message);
    } else {
      logger.warn(message);
    }
  }

  error(message: string, ...data: any[]) {
    if (data) {
      logger.error({ ...data }, message);
    } else {
      logger.error(message);
    }
  }

  fatal(message: string, ...data: any[]) {
    if (data) {
      logger.fatal({ ...data }, message);
    } else {
      logger.fatal(message);
    }
  }
}

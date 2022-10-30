// import * as pino from 'pino';
import * as winston from 'winston';

export class APILogger {
  logger: winston.Logger;

  constructor(name?: string) {
    let alignColorsAndTime = winston.format.combine(
      winston.format.colorize({
        all: true,
      }),
      winston.format.label({
        label: '[' + name + ']',
      }),
      winston.format.timestamp({
        // format: 'YY-MM-DD HH:mm:ss',
        format: 'HH:mm:ss',
      }),
      winston.format.printf((info) => ` ${info.timestamp} ${info.label} ${info.level}: ${info.message}`)
    );

    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.json(),
      defaultMeta: { service: 'user-service' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), alignColorsAndTime),
        }),
        new winston.transports.File({
          filename: 'AudibleSeries.log',
          format: winston.format.combine(
            winston.format.label({
              label: '[' + name + ']',
            }),
            winston.format.timestamp({
              // format: 'YY-MM-DD HH:mm:ss',
              format: 'HH:mm:ss',
            }),
            winston.format.printf((info) => ` ${info.timestamp} ${info.label} ${info.level}: ${info.message}`)
          ),
        }),
      ],
    });
  }

  trace(message: string) {
    this.logger.log('silly', message);
  }

  debug(message: string) {
    this.logger.log('debug', message);
  }

  info(message: string) {
    this.logger.log('info', message);
  }

  warn(message: string) {
    this.logger.log('warn', message);
  }

  error(message: string) {
    this.logger.log('error', message);
  }

  fatal(message: string) {
    this.logger.log('crit', message);
  }
}

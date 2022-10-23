// import * as pino from 'pino';

// const logger = pino.default({
//   level: 'trace',
//   transport: {
//     target: 'pino-pretty',
//     options: {
//       colorize: true,
//       singleLine: true,
//     },
//   },
// });

export class APILogger {
  trace(message: string, ...data: any[]) {
    return;
    if (data) {
      console.log('[TRACE] ' + message, JSON.stringify(data));
    } else {
      console.log('[TRACE] ' + message);
    }
  }

  debug(message: string, ...data: any[]) {
    return;
    if (data) {
      console.log('[DEBUG] ' + message, JSON.stringify(data));
    } else {
      console.log('[DEBUG] ' + message);
    }
  }

  info(message: string, ...data: any[]) {
    if (data) {
      console.info('[INFO] ' + message, JSON.stringify(data));
    } else {
      console.info('[INFO] ' + message);
    }
  }

  warn(message: string, ...data: any[]) {
    if (data) {
      console.warn('[WARN] ' + message, JSON.stringify(data));
    } else {
      console.warn('[WARN] ' + message);
    }
  }

  error(message: string, ...data: any[]) {
    if (data) {
      console.error('[ERROR] ' + message, JSON.stringify(data));
    } else {
      console.error('[ERROR] ' + message);
    }
  }

  fatal(message: string, ...data: any[]) {
    if (data) {
      console.error('[FATAL] ' + message, JSON.stringify(data));
    } else {
      console.error('[FATAL] ' + message);
    }
  }
}

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
      console.log('[TRACE] ' + message, ...data);
    } else {
      console.log('[TRACE] ' + message);
    }
  }

  debug(message: string, ...data: any[]) {
    return;
    if (data && data.length > 0) {
      console.log('[DEBUG] ' + message, ...data);
    } else {
      console.log('[DEBUG] ' + message);
    }
  }

  info(message: string, ...data: any[]) {
    if (data && data.length > 0) {
      console.info('[INFO] ' + message, ...data);
    } else {
      console.info('[INFO] ' + message);
    }
  }

  warn(message: string, ...data: any[]) {
    if (data && data.length > 0) {
      console.warn('[WARN] ' + message, ...data);
    } else {
      console.warn('[WARN] ' + message);
    }
  }

  error(message: string, ...data: any[]) {
    if (data && data.length > 0) {
      console.error('[ERROR] ' + message, ...data);
    } else {
      console.error('[ERROR] ' + message);
    }
  }

  fatal(message: string, ...data: any[]) {
    if (data && data.length > 0) {
      console.error('[FATAL] ' + message, ...data);
    } else {
      console.error('[FATAL] ' + message);
    }
  }
}

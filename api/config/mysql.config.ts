require('dotenv').config();
import { createPool, Pool } from 'mysql2';
import { APILogger } from '../logger/api.logger';
import { commands } from './mysql/init';

export { Pool };

let pool: Pool;
let logger: APILogger;

export const MySQLConnection = async (): Promise<Pool> => {
  if (pool) {
    return pool;
  }
  logger = new APILogger();

  MySQLCheck();

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const name = process.env.DB_NAME;
  logger.info('Setting up Mysql Connection :::', host, port, user, name);

  try {
    pool = createPool({
      connectionLimit: 100,
      host: host,
      user: user,
      password: password,
      database: name,
    });

    const oldQuery = pool.query;
    pool.query = function (...args): any {
      const queryCmd = oldQuery.apply(pool, args);
      logger.trace('Executing query', ...args);
      return queryCmd;
    };

    await checkIfDatabaseExists(pool);

    logger.info('MySql Adapter Pool generated successfully');
    return pool;
  } catch (error) {
    logger.error('[mysql.connector][init][Error]: ', error);
    throw new Error('failed to initialized pool');
  }
};

const checkIfDatabaseExists = async (mysql: Pool): Promise<void> => {
  return new Promise(function (resolve, reject) {
    MySQLConnection().then(async (pool) => {
      try {
        let results = await runQuery(pool, 'SHOW TABLES', []);
        if (results.length == commands.length) {
          logger.info('Database connection successful');
          resolve();
          return;
        }

        logger.info('Database connection successful, but missing tables, creating tables');

        try {
          for (let i = 0; i < commands.length; i++) {
            logger.trace('Creating table', commands[i]);
            await runQuery(pool, commands[i], []);
            logger.info('Tables created');
          }
        } catch (error) {
          logger.error('Failed to create table', error);
          reject(error);
          return;
        }
        resolve();
      } catch (error) {
        logger.error('Failed to check if database exists', error);
        throw new Error('Failed to check if database exists');
      }
      reject('Failed to check if database exists');
    });
  });
};

const runQuery = async (pool: Pool, sqlQuery: string, values: any | any[]): Promise<any> => {
  return new Promise(function (resolve, reject) {
    pool.query(sqlQuery, values, function (error, results, fields) {
      if (error) {
        reject(error);
      } else resolve(results);
    });
  });
};

export const MySQLCheck = (): void => {
  if (!process.env.DB_HOST) {
    throw new Error('DB_HOST is not defined');
  }
  if (!process.env.DB_PORT) {
    throw new Error('DB_PORT is not defined');
  }
  if (!process.env.DB_USER) {
    throw new Error('DB_USER is not defined');
  }
  if (!process.env.DB_PASSWORD) {
    throw new Error('DB_PASSWORD is not defined');
  }
  if (!process.env.DB_NAME) {
    throw new Error('DB_NAME is not defined');
  }
};

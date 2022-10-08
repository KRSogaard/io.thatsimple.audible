require("dotenv").config();
import { createPool, Pool } from "mysql2";
import { APILogger } from "../logger/api.logger";

export { Pool };

let pool: Pool;
let logger: APILogger;

export const MySQLConnection = async (): Promise<Pool> => {
  if (!logger) {
    logger = new APILogger();
  }

  if (pool) {
    return pool;
  }

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const name = process.env.DB_NAME;
  logger.info("Setting up Mysql Connection :::", host, port, user, password, name);

  try {
    pool = createPool({
      connectionLimit: 100,
      host: host,
      user: user,
      password: password,
      database: name,
    });

    const oldQuery = pool.query;
    pool.query = function(...args) : any {
      const queryCmd = oldQuery.apply(pool, args);
      logger.trace("Executing query", ...args);
      return queryCmd;
    }

    logger.info("MySql Adapter Pool generated successfully");
    return pool;
  } catch (error) {
    logger.error("[mysql.connector][init][Error]: ", error);
    throw new Error("failed to initialized pool");
  }
};

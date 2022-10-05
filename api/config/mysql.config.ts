require("dotenv").config();
import { createPool, Pool } from "mysql2";

export { Pool };

let pool: Pool;

export const MySQLConnection = async (): Promise<Pool> => {
  if (pool) {
    return pool;
  }

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const name = process.env.DB_NAME;
  console.log("Setting up Mysql Connection :::", host, port, user, password, name);

  try {
    pool = createPool({
      connectionLimit: 100,
      host: host,
      user: user,
      password: password,
      database: name,
    });

    console.debug("MySql Adapter Pool generated successfully");
    return pool;
  } catch (error) {
    console.error("[mysql.connector][init][Error]: ", error);
    throw new Error("failed to initialized pool");
  }
};

export const RabbitMQAudibleChannel = (): string => {
  return process.env.RABBITMQ_AUDIBLE_CHANNEL;
};

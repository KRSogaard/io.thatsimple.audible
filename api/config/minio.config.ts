import * as Minio from 'minio';
require('dotenv').config();
import { APILogger } from '../logger/api.logger';

let minioClient: Minio.Client;
let logger: APILogger;

export const MiniIOClient = (): Minio.Client => {
  if (minioClient) {
    return minioClient;
  }
  logger = new APILogger();

  if (!process.env.MINIO_END_POINT) {
    throw new Error('MINIO_END_POINT is not defined');
  }
  if (!process.env.MINIO_ACCESS_KEY) {
    throw new Error('MINIO_ACCESS_KEY is not defined');
  }
  if (!process.env.MINIO_SECRET_KEY) {
    throw new Error('MINIO_SECRET_KEY is not defined');
  }
  const endPoint = process.env.MINIO_END_POINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  logger.info('Setting up MinIO Client :::', endPoint, accessKey, secretKey);

  minioClient = new Minio.Client({
    endPoint: endPoint,
    port: 9000,
    useSSL: false,
    accessKey: accessKey,
    secretKey: secretKey,
  });

  return minioClient;
};

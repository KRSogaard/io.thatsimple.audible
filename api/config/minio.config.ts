import * as Minio from "minio";
require("dotenv").config();

let minioClient: Minio.Client;

export const MiniIOClient = (): Minio.Client => {
  if (minioClient) {
    return minioClient;
  }

  const endPoint = process.env.MINIO_END_POINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  console.log("Setting up MinIO Client :::", endPoint, accessKey, secretKey);

  minioClient = new Minio.Client({
    endPoint: endPoint,
    port: 9000,
    useSSL: false,
    accessKey: accessKey,
    secretKey: secretKey,
  });

  return minioClient;
};

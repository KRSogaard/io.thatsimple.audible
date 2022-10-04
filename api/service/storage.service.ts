import { APILogger } from "../logger/api.logger";
import * as Minio from "minio";
import { MiniIOClient } from "../config/minio.config";

const imageBucket: string = "audiobook-images";
const cacheBucket: string = "audible-webcache";

class StorageService {
  public logger: APILogger;
  minioClient: Minio.Client;

  constructor() {
    this.logger = new APILogger();
    this.minioClient = MiniIOClient();
    this.createBuckets();
  }

  async createBuckets(): Promise<void> {
    try {
      if (!(await this.minioClient.bucketExists(cacheBucket))) {
        await this.minioClient.makeBucket(cacheBucket, "us-east-1");
        await this.minioClient.setBucketLifecycle(cacheBucket, {
          Rule: [
            {
              ID: "Delete current version after 10 days",
              Status: "Enabled",
              Filter: {
                Prefix: "",
              },
              Expiration: {
                Days: "10",
              },
            },
          ],
        });
      }
    } catch (error) {
      this.logger.error("Failed to create webcache bucket", error);
    }

    try {
      if (!(await this.minioClient.bucketExists(imageBucket))) {
        await this.minioClient.makeBucket(imageBucket, "us-east-1");
      }
    } catch (error) {
      this.logger.error("Failed to create webcache bucket", error);
    }
  }

  async getImage(bookId: string): Promise<NodeJS.ReadableStream> {
    try {
      return await this.minioClient.getObject(imageBucket, this.getImageName(bookId));
    } catch (err) {
      this.logger.error("Failed to get image for book id [" + bookId + "]", err);
      return null;
    }
  }

  getImageName(bookId: string): string {
    return bookId.toUpperCase() + ".jpg";
  }
}

export default new StorageService();

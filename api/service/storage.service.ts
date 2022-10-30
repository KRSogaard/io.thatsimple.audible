import { APILogger } from '../logger/api.logger';
import * as Minio from 'minio';
import { MiniIOClient } from '../config/minio.config';

const imageBucket: string = 'audiobook-images';

class StorageService {
  logger: APILogger;
  minioClient: Minio.Client;

  constructor() {
    this.logger = new APILogger('StorageService');
    this.minioClient = MiniIOClient();
  }

  async saveImage(bookId: string, image: Buffer): Promise<void> {
    if (!bookId) {
      throw new Error('No book id provided');
    }

    try {
      await this.minioClient.putObject(imageBucket, this.getImageName(bookId), image);
    } catch (err) {
      this.logger.error('Failed to save image for book id [' + bookId + ']  Error: ' + err.message);
    }
  }

  async getImage(bookId: string): Promise<NodeJS.ReadableStream> {
    if (!bookId) {
      throw new Error('No book id provided');
    }

    try {
      return await this.minioClient.getObject(imageBucket, this.getImageName(bookId));
    } catch (err) {
      this.logger.error('Failed to get image for book id [' + bookId + '] Error: ' + err.message);
      return null;
    }
  }

  async hasImage(bookId: string): Promise<boolean> {
    if (!bookId) {
      throw new Error('No book id provided');
    }

    try {
      let stat = await this.minioClient.statObject(imageBucket, this.getImageName(bookId));
      return true;
    } catch (err) {
      this.logger.debug('Image Error: ' + err.message);
      return false;
    }
  }

  getImageName(bookId: string): string {
    if (!bookId) {
      throw new Error('No book id provided');
    }
    return bookId.toUpperCase() + '.jpg';
  }
}

export default new StorageService();

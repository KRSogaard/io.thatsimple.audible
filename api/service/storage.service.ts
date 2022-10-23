import { APILogger } from '../logger/api.logger';
import * as Minio from 'minio';
import { MiniIOClient } from '../config/minio.config';
import * as crypto from 'crypto';

const imageBucket: string = 'audiobook-images';
const cacheBucket: string = 'audible-webcache';

class StorageService {
  public logger: APILogger;
  minioClient: Minio.Client;

  constructor() {
    this.logger = new APILogger();
    this.minioClient = MiniIOClient();
  }

  async saveWebCache(url: string, html: string): Promise<void> {
    try {
      let filename = this.urlToHash(url);
      await this.minioClient.putObject(cacheBucket, filename, this.cleanHTML(html));
    } catch (error) {
      this.logger.error('Failed to save webcache', error);
    }
  }

  async getWebCache(url: string): Promise<string | null> {
    try {
      let filename = this.urlToHash(url);
      const stream = await this.minioClient.getObject(cacheBucket, filename);
      let string = await this.streamToString(stream);
      return string;
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return null;
      }
      this.logger.error('Failed to get webcache for url (' + url + ')', error);
      return null;
    }
  }

  streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    const chunks: any[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      stream.on('error', reject);
      stream.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
    });
  }

  urlToHash(url: string): string {
    if (url.includes('audible.com/pd/')) {
      // USE ASIN as the hash
      return 'books-' + url.split('?')[0].split('/').pop() + '.html';
    }
    return crypto.createHash('md5').update(url.split('?')[0]).digest('hex') + '.html';
  }

  async saveImage(bookId: string, image: Buffer): Promise<void> {
    try {
      await this.minioClient.putObject(imageBucket, this.getImageName(bookId), image);
    } catch (err) {
      this.logger.error('Failed to save image for book id [' + bookId + ']', err);
    }
  }

  async getImage(bookId: string): Promise<NodeJS.ReadableStream> {
    try {
      return await this.minioClient.getObject(imageBucket, this.getImageName(bookId));
    } catch (err) {
      this.logger.error('Failed to get image for book id [' + bookId + ']', err);
      return null;
    }
  }

  async hasImage(bookId: string): Promise<boolean> {
    try {
      let stat = await this.minioClient.statObject(imageBucket, this.getImageName(bookId));
      this.logger.debug('Stat', stat);
      return true;
    } catch (err) {
      this.logger.debug('Image Error: ', err);
      return false;
    }
  }

  getImageName(bookId: string): string {
    return bookId.toUpperCase() + '.jpg';
  }

  cleanHTML(html: string): string {
    // This may take some time, but it will half the size of the cache
    return html
      .replace(/<script[^>]*>(?:(?!<\/script>)[^])*<\/script>/g, '')
      .replace(/<style[^>]*>(?:(?!<\/style>)[^])*<\/style>/g, '')
      .replace(/<noscript[^>]*>(?:(?!<\/noscript>)[^])*<\/noscript>/g, '')
      .replace(/<link[^>]*>/g, '')
      .replace('</link>', '');
  }
}

export default new StorageService();

import ICachingProvider from './ICachingProvider';
import { APILogger } from '../../logger/api.logger';
import * as Minio from 'minio';
import * as crypto from 'crypto';

export class MinioCachingProvider implements ICachingProvider {
  logger: APILogger;
  client: Minio.Client;
  bucket: string;

  constructor(client: Minio.Client, bucket: string) {
    this.logger = new APILogger('MinioCachingProvider');
    this.client = client;
    this.bucket = bucket;
  }

  async hasCache(url: string): Promise<boolean> {
    try {
      let filename = this.urlToHash(url);
      const stream = await this.client.getObject(this.bucket, filename);
      return true;
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return false;
      }
      this.logger.error('Failed to get webcache for url ' + url + ', ' + error.message);
      return false;
    }
  }
  async getCache(url: string): Promise<string> {
    try {
      let filename = this.urlToHash(url);
      const stream = await this.client.getObject(this.bucket, filename);
      let string = await this.streamToString(stream);
      return string;
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return null;
      }
      this.logger.error('Failed to get webcache for url ' + url + ', ' + error.message);
      return null;
    }
  }
  async saveCache(url: string, data: string): Promise<void> {
    try {
      let filename = this.urlToHash(url);
      await this.client.putObject(this.bucket, filename, data);
    } catch (error) {
      this.logger.error('Failed to save webcache: ' + error.message);
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
}

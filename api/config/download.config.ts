import { DownloadService } from '../service/download';
import axios from 'axios';
import ICachingProvider from '../service/download/ICachingProvider';
import { MinioCachingProvider } from '../service/download/MinioCachingProvider';
import { MiniIOClient } from './minio.config';
import { APILogger } from '../logger/api.logger';

let instance: DownloadService = null;
let logger: APILogger;

export const Download = async (): Promise<DownloadService> => {
  logger = new APILogger('DownloadConfig');
  let client = axios.create();

  if (!instance) {
    let proxyList = [];

    const proxyListUrl = process.env.PROXY_LIST_URL;
    if (proxyListUrl) {
      logger.info(`Loading proxy list from ${proxyListUrl}`);
      let reponse = await client.get(proxyListUrl);
      reponse.data.split('\n').forEach((proxy) => {
        if (proxy.length > 0) {
          proxyList.push({
            host: proxy.split(':')[0],
            port: proxy.split(':')[1].trim(),
          });
        }
      });
    }

    logger.info('Found ' + proxyList.length + ' proxies');
    let caching: ICachingProvider = new MinioCachingProvider(MiniIOClient(), 'audible-webcache');
    instance = new DownloadService(caching, proxyList);
  }
  return instance;
};

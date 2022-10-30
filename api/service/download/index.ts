import * as crypto from 'crypto';
import axios, { ResponseType, AxiosRequestConfig, AxiosProxyConfig, AxiosInstance } from 'axios';
import { NullCachingProvider } from './NullCachingProvider';
import { APILogger } from '../../logger/api.logger';
import ICachingProvider from './ICachingProvider';
import { FatalError, RetryableError } from '../audible_management.service';
import * as fs from 'fs';
import * as path from 'path';

export interface DownloadReponse {
  status: number;
  data?: any;
  cached?: boolean;
}

interface ProxyBan {
  host: string;
  unban: number;
}

export class DownloadService {
  maxFetchTimeBan = 5000;
  bannedProxiesFilename = 'bannedProxies.txt';
  successfullRequests = 0;
  failedRequests = 0;
  errorCodes = new Map<string, number>();

  logger: APILogger;
  caching: ICachingProvider;
  proxyList: AxiosProxyConfig[];
  blockedProxies: ProxyBan[];
  userAgents = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
    'Windows 10/ Edge browser: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
    'Mac OS X10/Safari browser: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9',
    'Linux PC/Firefox browser: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1',
    'Chrome OS/Chrome browser: Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36',
  ];
  client: AxiosInstance;

  constructor(caching?: ICachingProvider, proxyList?: AxiosProxyConfig[]) {
    this.logger = new APILogger('DownloadService');
    this.client = axios.create();

    if (caching) {
      this.logger.info('Creating DownloadService with caching provider: ' + caching.constructor.name);
      this.caching = caching;
    } else {
      this.logger.info('Creating DownloadService with no caching provider');
      this.caching = new NullCachingProvider();
    }
    this.blockedProxies = [];
    this.proxyList = [];

    this.logger.info("Using banned proxies file: '" + path.join(__dirname, this.bannedProxiesFilename) + "'");
    if (fs.existsSync(path.join(__dirname, this.bannedProxiesFilename))) {
      let content = fs.readFileSync(path.join(__dirname, this.bannedProxiesFilename), 'utf8');
      content
        .split('\n')
        .filter((s) => s && s.trim().length > 0)
        .forEach((line) => {
          let parts = line.split(',');
          this.blockProxy(parts[0].trim(), parseInt(parts[1].trim()));
        });
      this.updateProxyBanFile();
    }
    if (proxyList) {
      this.logger.info('Creating DownloadService with proxy list: ' + proxyList.length);
      this.proxyList = proxyList;
    } else {
      this.logger.info('Creating DownloadService with no proxy list');
    }
  }

  getAvalibleProxies(): AxiosProxyConfig[] {
    let before = this.blockedProxies.length;
    this.blockedProxies = this.blockedProxies.filter((p) => p.unban > Date.now());
    let remove = before - this.blockedProxies.length;
    if (remove > 0) {
      this.logger.debug('Removed ' + remove + ' proxies from ban list');
    }
    this.logger.debug('Current blocked proxies: ' + this.blockedProxies.length);
    return this.proxyList.filter((p) => !this.blockedProxies.some((b) => b.host === p.host));
  }
  getProxy(): AxiosProxyConfig | null {
    if (this.proxyList.length === 0) {
      return null;
    }
    let possibleProxies = this.getAvalibleProxies();
    if (possibleProxies.length === 1) {
      this.logger.debug('Using proxy: ' + possibleProxies[0].host + ':' + possibleProxies[0].port);
      return possibleProxies[0];
    }
    if (possibleProxies.length === 0) {
      this.logger.error('No more proxies available, all are blocked');
      throw new RetryableError('No more proxies available, all are blocked');
    }
    let index = crypto.randomInt(0, possibleProxies.length - 1);
    this.logger.debug('Using proxy: ' + possibleProxies[index].host + ':' + possibleProxies[index].port);
    if (this.blockedProxies.some((p) => p.host === possibleProxies[index].host)) {
      throw new FatalError("How could we get a blocked proxy? It's not possible!");
    }
    return possibleProxies[index];
  }

  blockProxy(host: string, unban?: number): void {
    if (unban && unban < Date.now()) {
      return;
    }

    let unbanTime = unban ? unban : Date.now() + 60 * 10 * 1000;
    this.blockedProxies.push({
      host: host,
      unban: unbanTime,
    });
    this.logger.debug('Proxy ' + host + ' is now blocked until ' + new Date(unbanTime).toLocaleString());
    this.logger.warn(
      'Blocking proxy: ' + host + ' for 10 min: ' + this.getAvalibleProxies().length + ' proxies left, ' + this.blockedProxies.length + ' blocked'
    );

    fs.appendFileSync(path.join(__dirname, this.bannedProxiesFilename), host + ',' + unbanTime + '\n');
  }
  updateProxyBanFile(): void {
    this.logger.debug('Removing proxies that are no longer banned from the ban file');
    fs.unlinkSync(path.join(__dirname, this.bannedProxiesFilename));
    this.blockedProxies
      .filter((p) => p.unban > Date.now())
      .forEach((b) => {
        fs.appendFileSync(path.join(__dirname, this.bannedProxiesFilename), b.host + ',' + b.unban + '\n');
      });
  }

  getUserAgent(): string | null {
    if (this.userAgents.length === 0) {
      return null;
    }
    if (this.userAgents.length === 1) {
      return this.userAgents[0];
    }
    let index = crypto.randomInt(0, this.userAgents.length - 1);
    return this.userAgents[index];
  }

  async getRequestConfig(): Promise<AxiosRequestConfig> {
    let config: AxiosRequestConfig = {
      headers: {
        'User-Agent': this.getUserAgent(),
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: this.maxFetchTimeBan,
      decompress: true,
    };

    if (this.proxyList && this.proxyList.length > 0) {
      config = {
        ...config,
        proxy: this.getProxy(),
      };
    }

    return config;
  }

  public async downloadHtml(downloadUrl: string): Promise<DownloadReponse | null> {
    let html = await this.caching.getCache(downloadUrl);
    if (html && html.length > 10) {
      this.logger.debug('Using cached html for: ' + downloadUrl + ' html length: ' + html.length);
      return {
        status: 200,
        data: html,
        cached: true,
      };
    }

    this.logger.debug('Downloading HTML from: ' + downloadUrl);
    const config = await this.getRequestConfig();

    try {
      let start = Date.now();
      this.logger.trace('Downloading HTML from: ' + downloadUrl + ' with config: ' + JSON.stringify(config));
      const { headers, status, data } = await this.client.get(downloadUrl, config);
      let time = Date.now() - start;
      this.logger.debug('Download of ' + downloadUrl + ' complete with status ' + status + ', took: ' + time + ' ms ');
      this.reportProxyStats(config, time);
      this.reportProxyConnection(true);

      if (status === 200) {
        await this.caching.saveCache(downloadUrl, data);
        // End temp
        return {
          status: 200,
          data: data,
          cached: false,
        };
      }
      this.logger.warn('Got non 200 status code: ' + status + ' for url: ' + downloadUrl);
      return {
        status: status,
      };
    } catch (error: any) {
      this.logger.warn('Error (' + error.code + ') while downloading html ' + error.message + ' for ' + downloadUrl);
      this.handleProxyErrors(error, config.proxy);

      if (error.response && error.response.status === 404) {
        this.logger.warn('404 error for ' + downloadUrl);
        return {
          status: 404,
        };
      }
      if (error.response && error.response.status === 502 && config.proxy) {
        this.logger.warn('Got error 502 Bad Gateway error, banning proxy: ' + downloadUrl);
        this.blockProxy(config.proxy.host);
        throw new RetryableError("Got error 502 Bad Gateway error, banning proxy: '" + downloadUrl + "'");
      }
      this.logger.error('Error (Status code: ' + error.response?.status + ') while downloading book html for ' + downloadUrl + '. ' + error.message);
      throw new FatalError('Error while downloading book html for ' + downloadUrl + '. ' + error.message);
    }
  }

  public async downloadImage(downloadUrl: string): Promise<Buffer> {
    const config = await this.getRequestConfig();
    config.responseType = <ResponseType>'arraybuffer';

    try {
      let start = Date.now();
      const { headers, status, data } = await this.client.get(downloadUrl, config);
      let time = Date.now() - start;
      this.logger.debug('Html status: ' + status + ' took: ' + time + ' ms ');
      this.reportProxyStats(config, time);
      this.reportProxyConnection(true);
      return data;
    } catch (error: any) {
      this.logger.error('Error (Status code: ' + error.status + ') while downloading book image for ' + downloadUrl + '. ' + error.message);
      this.handleProxyErrors(error, config.proxy);
      throw new FatalError('Failed to download image: ' + error.message);
    }
  }

  handleProxyErrors(error: any, proxy?: any) {
    switch (error.code) {
      case 'ERR_BAD_RESPONSE':
      case 'ECONNRESET':
      case 'ECONNREFUSED':
      case 'ECONNABORTED':
      case 'ENOTFOUND':
      case 'ETIMEDOUT':
      case 'EPROTO':
        this.logger.warn(error.code + ' error this is a retryable error');
        if (proxy) {
          this.blockProxy(error.config.proxy.host);
        }
        this.reportProxyConnection(false, error.code);
        throw new RetryableError("Got connection error, this is proberly a proxy error, let's try again");
    }
  }

  reportProxyStats(config: any, time: number) {
    if (config.proxy) {
      if (time > this.maxFetchTimeBan) {
        this.logger.warn('Banning proxy ' + config.proxy.host + ' for 10 min because it took too long to respond');
        this.blockProxy(config.proxy.host);
      }
    }
  }

  reportProxyConnection(success: boolean, errorCode?: string) {
    if (success) {
      this.successfullRequests++;
    } else {
      this.failedRequests++;
      if (errorCode) {
        if (this.errorCodes[errorCode]) {
          this.errorCodes[errorCode]++;
        } else {
          this.errorCodes[errorCode] = 1;
        }
      }
      this.logger.error(
        'Proxy stats: ' +
          this.failedRequests +
          ' of ' +
          (this.successfullRequests + this.failedRequests) +
          ' (' +
          Math.round((this.failedRequests / (this.successfullRequests + this.failedRequests)) * 100) +
          '%) requests failed: ' +
          JSON.stringify(this.errorCodes)
      );
    }
  }
}

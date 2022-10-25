import axios, { ResponseType } from 'axios';
import StorageService from '../service/storage.service';
import { APILogger } from '../logger/api.logger';
const logger = new APILogger();

export interface DownloadReponse {
  status: number;
  data?: any;
  cached?: boolean;
}

export const downloadHtml = async (downloadUrl: string): Promise<DownloadReponse | null> => {
  let html = await StorageService.getWebCache(downloadUrl);
  if (html && html.length > 10) {
    logger.debug('Using cached html for: ' + downloadUrl, 'html length: ', html.length);
    return {
      status: 200,
      data: html,
      cached: true,
    };
  }

  logger.debug('Downloading HTML from: ' + downloadUrl);
  const config = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0',
    },
  };

  try {
    logger.trace('Downloading HTML from: ' + downloadUrl + ' with config: ', config);
    const { headers, status, data } = await axios.get(downloadUrl, config);
    logger.debug('Html status: ' + status);

    if (status === 404) {
      logger.warn('404 (inner) error for ' + downloadUrl);
      return {
        status: 404,
      };
    }
    if (status !== 200) {
      logger.error('Http response was not 200: ' + status, status, data, headers);
      return {
        status: status,
      };
    }
    await StorageService.saveWebCache(downloadUrl, data);
    // End temp
    return {
      status: 200,
      data: data,
      cached: false,
    };
  } catch (error: any) {
    logger.trace('Error while downloading html: ' + downloadUrl, error);
    if (error.response.status === 404) {
      logger.warn('404 error for ' + downloadUrl);
      return {
        status: 404,
      };
    }
    logger.error('Error (Status code: ' + error.response.status + ') while downloading book html for ' + downloadUrl + '. ' + error.message);
    return {
      status: 500,
    };
  }
};

export const downloadImage = async (downloadUrl: string): Promise<Buffer> => {
  const config = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0',
    },
    responseType: <ResponseType>'arraybuffer',
  };

  try {
    const { headers, status, data } = await axios.get(downloadUrl, config);
    return data;
  } catch (error: any) {
    logger.error('Error (Status code: ' + error.status + ') while downloading book image for ' + downloadUrl);
  }
};

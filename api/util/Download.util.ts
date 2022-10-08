import axios, { ResponseType } from 'axios';
import StorageService from '../service/storage.service';
import { APILogger } from '../logger/api.logger';
const logger = new APILogger();

export const downloadHtml = async (downloadUrl: string): Promise<string | null> => {
    let html = await StorageService.getWebCache(downloadUrl);
    if (html) {
        logger.debug('Using cached html for: ' + downloadUrl);
        return html;
    }

    logger.debug('Downloading HTML from: ' + downloadUrl);
    const config = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0',
        },
    };

    try {
        const { headers, status, data } = await axios.get(downloadUrl, config);
        // This is temp
        await StorageService.saveWebCache(downloadUrl, data);
        // End temp
        return data;
    } catch (error: any) {
        logger.error('Error (Status code: ' + error.status + ') while downloading book html for ' + downloadUrl);
        return null;
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

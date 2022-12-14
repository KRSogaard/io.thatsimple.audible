import { APILogger } from '../logger/api.logger';
import StorageService from '../service/storage.service';

export class ImageController {
  private logger: APILogger;

  constructor() {
    this.logger = new APILogger('ImageController');
  }

  async getImage(bookId: string, res): Promise<void> {
    let imageStream = await StorageService.getImage(bookId);
    if (imageStream) {
      imageStream.pipe(res);
    } else {
      res.status(404).send('Not found');
    }
  }
}

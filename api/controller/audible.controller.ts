import { Response } from 'express-serve-static-core';
import { APILogger } from '../logger/api.logger';
import { User } from '../models/user.model';
import { AudibleUserService } from '../service/user.service';
import * as Queue from '../util/Queue.util';

export class AudibleController {
  logger: APILogger;
  userService: AudibleUserService;

  constructor() {
    this.logger = new APILogger();
    this.userService = new AudibleUserService();
  }

  async requestBookDownload(user: User, bookUrl: string, res: Response<any, Record<string, any>, number>) {
    await Queue.sendDownloadBook(bookUrl, user.id);
    res.status(200).send({ message: 'Book download request received' });
  }
}

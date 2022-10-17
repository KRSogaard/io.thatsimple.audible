import * as bodyParser from 'body-parser';
const path = require('path');
import * as express from 'express';
import { APILogger } from './logger/api.logger';
import { ImageController } from './controller/image.controller';
import { UserController } from './controller/user.controller';
import { AudibleUserService } from './service/user.service';
import { AudibleController } from './controller/audible.controller';
var cors = require('cors');

class App {
  express: express.Application;
  logger: APILogger;
  imageController: ImageController;
  userController: UserController;
  userService: AudibleUserService;
  audibleService: AudibleController;

  protectedPaths = [
    {
      startsWith: false,
      path: '/api/user',
      method: 'GET',
    },
    {
      startsWith: false,
      path: '/api/book',
      method: 'POST',
    },
    {
      startsWith: false,
      path: '/api/my-series',
      method: 'GET',
    },
    {
      startsWith: true,
      path: '/api/user/archive/',
      method: 'POST',
    },
    {
      startsWith: true,
      path: '/api/user/archive/',
      method: 'DELETE',
    },
    {
      startsWith: false,
      path: '/api/user/jobs',
      method: 'GET',
    },
  ];

  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
    this.logger = new APILogger();

    this.imageController = new ImageController();
    this.userController = new UserController();
    this.userService = new AudibleUserService();
    this.audibleService = new AudibleController();
  }

  // Configure Express middleware.
  private middleware(): void {
    this.express.use(cors());
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(express.static(path.join(__dirname, '../ui/build')));
    this.express.use(async (req: Record<string, any>, res, next) => {
      let isAuthRequired = false;
      this.protectedPaths.forEach((protectedPath) => {
        if (
          (!protectedPath.startsWith && protectedPath.path.toLowerCase() === req.path.toLowerCase()) ||
          (protectedPath.startsWith && req.path.startsWith(protectedPath.path) && protectedPath.method.toLowerCase() === req.method.toLowerCase())
        ) {
          isAuthRequired = true;
          this.logger.info('Auth required for ' + req.path);
        }
      });

      let token = null;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
        this.logger.debug('Token: ' + token);

        let user = await this.userService.getUserByToken(token);
        if (!user) {
          res.status(401).send('Unauthorized');
          return;
        }
        req.user = user;
      }

      if (isAuthRequired) {
        if (!req.user) {
          res.status(401).send('Unauthorized');
          return;
        }
        next();
      } else {
        next();
      }
    });
  }

  private routes(): void {
    this.express.get('/api/image/:bookId.jpg', async (req, res) => {
      this.imageController.getImage(req.params.bookId, res);
    });

    this.express.post('/api/user', async (req, res) => {
      this.userController.createUser(req.body, res);
    });

    this.express.post('/api/user/archive/:seriesId', async (req: any, res: any) => {
      this.userController.archiveSeries(req.user, req.params.seriesId, res);
    });

    this.express.delete('/api/user/archive/:seriesId', async (req: any, res: any) => {
      this.userController.unarchiveSeries(req.user, req.params.seriesId, res);
    });

    this.express.get('/api/user', async (req: any, res) => {
      this.userController.getMe(req.user, res);
    });

    this.express.post('/api/auth', async (req, res) => {
      this.userController.authUser(req.body?.username, req.body?.password, res);
    });

    this.express.post('/api/book', async (req: any, res) => {
      this.audibleService.requestBookDownload(req.user, req.body?.bookUrl, res);
    });

    this.express.get('/api/my-series', async (req: any, res) => {
      this.audibleService.getSeriesWithBooks(req.user, res);
    });

    this.express.get('/api/user/jobs', async (req: any, res) => {
      this.userController.getCurrentJobs(req.user, res);
    });

    // handle undefined routes
    this.express.use('*', (req, res, next) => {
      res.status(404).send('Not Found');
    });
  }
}

export default new App().express;

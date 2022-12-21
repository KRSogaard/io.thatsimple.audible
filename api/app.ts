import * as bodyParser from 'body-parser';
import path from 'path';
import express from 'express';
import { APILogger } from './logger/api.logger';
import { ImageController } from './controller/image.controller';
import { UserController } from './controller/user.controller';
import { UserService } from './service/dal/user';
import { AudibleController } from './controller/audible.controller';
var cors = require('cors');

class App {
  express: express.Application;
  logger: APILogger;
  imageController: ImageController;
  userController: UserController;
  userService: UserService;
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
    this.logger = new APILogger('App');

    this.imageController = new ImageController();
    this.userController = new UserController();
    this.userService = new UserService();
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
        if (!protectedPath.method.toLowerCase().includes(req.method.toLowerCase())) {
          return;
        }

        if (protectedPath.startsWith) {
          if (req.path.startsWith(protectedPath.path)) {
            isAuthRequired = true;
          }
        } else if (req.path === protectedPath.path) {
          isAuthRequired = true;
        }
      });

      let token = null;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
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

    this.express.post('/api/user/archive/:seriesId', async (req: any, res: any) => {
      this.userController.archiveSeries(req.user, req.params.seriesId, res);
    });

    this.express.delete('/api/user/archive/:seriesId', async (req: any, res: any) => {
      this.userController.unarchiveSeries(req.user, req.params.seriesId, res);
    });

    this.express.get('/api/user', async (req: any, res) => {
      this.userController.getMe(req.user, res);
    });

    this.express.post('/api/user', async (req: any, res) => {
      this.userController.registerUser(req.body?.username, req.body?.password, req.body?.email, res);
    });

    this.express.post('/api/auth', async (req, res) => {
      this.userController.authUser(req.body?.username, req.body?.password, res);
    });

    this.express.post('/api/book', async (req: any, res) => {
      this.audibleService.requestBookDownload(req.user, req.body?.asin, res);
    });

    this.express.get('/api/my-series', async (req: any, res) => {
      this.audibleService.getSeriesWithBooks(req.user, res);
    });

    this.express.get('/api/user/jobs', async (req: any, res) => {
      this.userController.getCurrentJobs(req.user, res);
    });

    // Send all other requests to the React app
    this.express.use('*', async (req: any, res) => {
      res.sendFile(path.join(__dirname, '../ui/build/index.html'));
    });

    // // handle undefined routes
    // this.express.use('*', (req, res, next) => {
    //   res.status(404).send('Not Found');
    // });
  }
}

export default new App().express;

import * as bodyParser from 'body-parser';
const path = require('path');
import * as express from 'express';
import { APILogger } from './logger/api.logger';
import { ImageController } from './controller/image.controller';
import { UserController } from './controller/user.controller';
import { AudibleUserService } from './service/user.service';
import { AudibleController } from './controller/audible.controller';

class App {
  express: express.Application;
  logger: APILogger;
  imageController: ImageController;
  userController: UserController;
  userService: AudibleUserService;
  audibleService: AudibleController;

  protectedPaths = [
    {
      startsWith: true,
      path: '/api/image',
      method: 'GET',
    },
    {
      path: '/api/user',
      method: 'GET',
    },
    {
      path: '/api/book',
      method: 'POST',
    },
  ];

  /* Swagger files start */
  // private swaggerFile: any = (process.cwd()+"/swagger/swagger.json");
  // private swaggerData: any = fs.readFileSync(this.swaggerFile, 'utf8');
  // private customCss: any = fs.readFileSync((process.cwd()+"/swagger/swagger.css"), 'utf8');
  // private swaggerDocument = JSON.parse(this.swaggerData);
  /* Swagger files end */

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
    // this.express.get('/api/test', async (req, res) => {
    //   this.logger.info('Testing: Parsing book');
    //   let audibleService = new AudibleManagementService();

    //   let testBook1 = 'https://www.audible.com/pd/Lord-January-Audiobook/B09PNVB5FN';
    //   let testBook2 = 'https://www.audible.com/pd/Fairy-Tale-Audiobook/B09R62PV4B';
    //   let testBook3 = 'https://www.audible.com/pd/The-Sandman-Act-III-Audiobook/B0BFK1K36D';
    //   let testBook4 = 'https://www.audible.com/pd/Harry-Potter-and-the-Sorcerers-Stone-Book-1-Audiobook/B017V4IM1G';
    //   let testBook5 = 'https://www.audible.com/pd/Harry-Potter-A-History-of-Magic-Audiobook/B07FMMSF5H';
    //   let testBook6 = 'https://www.audible.com/pd/Edens-Gate-The-Scourge-Audiobook/B09L1Y7MKP';
    //   let testBook7 = 'https://www.audible.com/pd/The-Tricksters-Tale-Audiobook/B09YYZMNBL';
    //   let testBook8 = 'https://www.audible.com/pd/1-in-Customer-Service-Audiobook/B07YL79YNK';
    //   let testBook9 = 'https://www.audible.com/pd/Bio-Dungeon-Omnibus-Audiobook/B0B2TT3CBV';

    //   let testSeries1 = 'https://www.audible.com/series/Wizarding-World-Audiobooks/B07CM5ZDJL';
    //   let testSeries2 = 'https://www.audible.com/series/Edens-Gate-Audiobooks/B074GFN35N';
    //   let testSeries3 = 'https://www.audible.com/series/The-Tricksters-Tale-Audiobooks/B09Z28LGW6';
    //   let testSeries4 = 'https://www.audible.com/series/The-Adventures-of-Tom-Stranger-Interdimensional-Insurance-Agent-Audiobooks/B0793R8X2P';
    //   let testSeries5 = 'https://www.audible.com/series/The-Bodys-Dungeon-Audiobooks/B089WHL4WV';

    //   res.json({
    //     //book: Parser.parseBook(await Download.downloadHtml("https://www.audible.com/pd/The-Sandman-Act-III-Audiobook/B0BFK1K36D")),
    //     series: Parser.parseSeries(await Download.downloadHtml(testSeries1)),
    //   });

    //   //this.saveController.getTasks().then(data => res.json(data));
    // });

    this.express.get('/api/image/:bookId.jpg', async (req, res) => {
      this.imageController.getImage(req.params.bookId, res);
    });

    this.express.post('/api/user', async (req, res) => {
      this.userController.createUser(req.body, res);
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

    // this.express.post('/api/saves', (req, res) => {
    //     console.log(req.body);
    //     this.saveController.createTask(req.body.task).then(data => res.json(data));
    // });

    // this.express.delete('/api/saves/:id', (req, res) => {
    //     this.saveController.deleteTask(req.params.id).then(data => res.json(data));
    // });

    // this.express.get("/", (req, res, next) => {
    //     res.sendFile(path.join(__dirname, '../ui/build/index.html'));
    // });

    // swagger docs
    //this.express.use('/api/docs', swaggerUi.serve, swaggerUi.setup(this.swaggerDocument, null, null, this.customCss));

    // handle undefined routes
    this.express.use('*', (req, res, next) => {
      res.send('Make sure url is correct!!!');
    });
  }
}

export default new App().express;

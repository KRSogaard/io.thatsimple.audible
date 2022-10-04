import * as bodyParser from "body-parser";
const path = require("path");
import * as express from "express";
import { APILogger } from "./logger/api.logger";
import swaggerUi = require("swagger-ui-express");
import { AudibleService } from "./service/audible.service";
import { ImageController } from "./controller/image.controller";

class App {
  public express: express.Application;
  public logger: APILogger;
  public imageController: ImageController;

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
  }

  // Configure Express middleware.
  private middleware(): void {
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(express.static(path.join(__dirname, "../ui/build")));
  }

  private routes(): void {
    this.express.get("/api/test", async (req, res) => {
      this.logger.info("Testing: Parsing book");
      let audibleService = new AudibleService();

      let testBook1 = "https://www.audible.com/pd/Lord-January-Audiobook/B09PNVB5FN";
      let testBook2 = "https://www.audible.com/pd/Fairy-Tale-Audiobook/B09R62PV4B";
      let testBook3 = "https://www.audible.com/pd/The-Sandman-Act-III-Audiobook/B0BFK1K36D";
      let testBook4 = "https://www.audible.com/pd/Harry-Potter-and-the-Sorcerers-Stone-Book-1-Audiobook/B017V4IM1G";
      let testBook5 = "https://www.audible.com/pd/Harry-Potter-A-History-of-Magic-Audiobook/B07FMMSF5H";
      let testBook6 = "https://www.audible.com/pd/Edens-Gate-The-Scourge-Audiobook/B09L1Y7MKP";
      let testBook7 = "https://www.audible.com/pd/The-Tricksters-Tale-Audiobook/B09YYZMNBL";
      let testBook8 = "https://www.audible.com/pd/1-in-Customer-Service-Audiobook/B07YL79YNK";
      let testBook9 = "https://www.audible.com/pd/Bio-Dungeon-Omnibus-Audiobook/B0B2TT3CBV";

      let testSeries1 = "https://www.audible.com/series/Wizarding-World-Audiobooks/B07CM5ZDJL";
      let testSeries2 = "https://www.audible.com/series/Edens-Gate-Audiobooks/B074GFN35N";
      let testSeries3 = "https://www.audible.com/series/The-Tricksters-Tale-Audiobooks/B09Z28LGW6";
      let testSeries4 = "https://www.audible.com/series/The-Adventures-of-Tom-Stranger-Interdimensional-Insurance-Agent-Audiobooks/B0793R8X2P";
      let testSeries5 = "https://www.audible.com/series/The-Bodys-Dungeon-Audiobooks/B089WHL4WV";

      res.json({
        book: audibleService.parseBook(await audibleService.downloadHtml(testBook9)),
        series: audibleService.parseSeries(await audibleService.downloadHtml(testSeries5)),
      });

      //this.saveController.getTasks().then(data => res.json(data));
    });

    this.express.get("/api/image/:bookId.jpg", async (req, res) => {
      this.imageController.getImage(req.params.bookId, res);
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
    this.express.use("*", (req, res, next) => {
      res.send("Make sure url is correct!!!");
    });
  }
}

export default new App().express;

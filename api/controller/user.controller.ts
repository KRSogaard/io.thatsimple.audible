import { APILogger } from '../logger/api.logger';
import { AudibleUserService } from '../service/user.service';
import * as UserUtil from '../util/User.util';

export class UserController {
  private logger: APILogger;
  userService: AudibleUserService;

  constructor() {
    this.logger = new APILogger();
    this.userService = new AudibleUserService();
  }

  async createUser(body: any, res): Promise<void> {
    this.logger.info('UserController: GetImage', body);
    if (
      !body.username ||
      body.username.length < 3 ||
      !body.password ||
      body.password.length < 3 ||
      !body.email ||
      body.email.length < 3 ||
      !UserUtil.validateEmail(body.email)
    ) {
      res.status(400).send('Required fields missing');
      return;
    }

    let userId = await this.userService.createUser(body);
    res.status(200).send({ userId: userId });
  }

  async verifyUser(body: any, res): Promise<void> {
    this.logger.info('UserController: VerifyUser', body);
    if (!body.username || body.username.length < 3 || !body.password || body.password.length < 3) {
      res.status(400).send('Required fields missing');
      return;
    }

    let token = await this.userService.verifyUser(body.username, body.password);
    if (token) {
      res.status(200).send({ token: token });
    } else {
      res.status(401).send('Invalid username or password');
    }
  }

  async authUser(username: string, password: string, res: any): Promise<void> {
    this.logger.info('UserController: AuthUser: ' + username);
    if (!username || username.length < 3 || !password || password.length < 3) {
      res.status(401).send('Invalid username or password');
      return;
    }

    let token = await this.userService.verifyUser(username, password);
    if (token) {
      res.status(200).send({ token: token });
    } else {
      res.status(401).send('Invalid username or password');
    }
  }

  async getMe(user: any, res: any): Promise<void> {
    this.logger.info('UserController: GetMe: ' + user.username);
    res.status(200).send({
      username: user.username,
      email: user.email,
      created: user.created,
    });
  }
}

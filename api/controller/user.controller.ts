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

  async authUser(username: string, password: string, res: any): Promise<void> {
    this.logger.info('UserController: AuthUser: ' + username);
    if (!username || username.length < 3 || !password || password.length < 3) {
      res.status(401).send(JSON.stringify({ message: 'Invalid username or password' }));
      return;
    }

    let token = await this.userService.verifyUser(username, password);
    if (token) {
      res.status(200).send(JSON.stringify({ token: token.token, expires: token.expires }));
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

  async archiveSeries(user: any, seriesId: number, res: any): Promise<void> {
    this.logger.info('UserController: archive series: ' + user.username);
    await this.userService.archiveSeries(user.id, seriesId);
    res.status(200).send({ success: true });
  }

  async unarchiveSeries(user: any, seriesId: number, res: any): Promise<void> {
    this.logger.info('UserController: unarchive series: ' + user.username);
    await this.userService.unarchiveSeries(user.id, seriesId);
    res.status(200).send({ success: true });
  }

  async getCurrentJobs(user: any, res: any): Promise<void> {
    this.logger.info('UserController: getCurrentJobs: ' + user.username);
    let jobs = await this.userService.getCurrentJobs(user.id);
    res.status(200).send(jobs);
  }
}

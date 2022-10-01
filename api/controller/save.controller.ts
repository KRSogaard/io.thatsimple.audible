import { APILogger } from '../logger/api.logger';
import { SaveService } from '../service/save.service';

export class SaveController {

    private saveService: SaveService;
    private logger: APILogger;

    constructor() {
        this.saveService = new SaveService();
        this.logger = new APILogger()
    }

    async getTasks() {
        this.logger.info('Controller: getTasks', null)
        return await this.saveService.getTasks();
    }

    async createTask(task) {
        this.logger.info('Controller: createTask', task);
        return await this.saveService.createTask(task);
    }

    async updateTask(task) {
        this.logger.info('Controller: updateTask', task);
        return await this.saveService.updateTask(task);
    }

    async deleteTask(taskId) {
        this.logger.info('Controller: deleteTask', taskId);
        return await this.saveService.deleteTask(taskId);
    }
}

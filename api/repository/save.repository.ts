import { connect, disconnect } from "../config/db.config";
import { SaveModel } from '../model/save.model';
import { APILogger } from '../logger/api.logger';

export class SaveRepository {

    private logger: APILogger;

    constructor() {
        connect();
        this.logger = new APILogger()
    }

    async getTasks() {
        const tasks = await SaveModel.find({});
        console.log('Saves::', tasks);
        return tasks;
    }

    async createTask(task) {
        let data = {};
        try {
            data = await SaveModel.create(task);
        } catch(err) {
            this.logger.error('Saves::Error::' + err);
        }
        return data;
    }

    async updateTask(task) {
        let data = {};
        try {
            data = await SaveModel.updateOne(task);
        } catch(err) {
            this.logger.error('Saves::Error::' + err);
        }
        return data;
    }

    async deleteTask(taskId) {
        let data: any = {};
        try {
            data = await SaveModel.deleteOne({_id : taskId});
        } catch(err) {
            this.logger.error('Saves::Error::' + err);
        }
        return {status: `${data.deletedCount > 0 ? true : false}`};
    }
}
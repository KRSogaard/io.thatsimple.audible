import { SaveRepository } from '../repository/save.repository';

export class SaveService {

    private taskRepository: SaveRepository;

    constructor() {
        this.taskRepository = new SaveRepository();
    }

    async getTasks() {
        return await this.taskRepository.getTasks();
    }

    async createTask(task) {
        return await this.taskRepository.createTask(task);
    }

    async updateTask(task) {
        return await this.taskRepository.updateTask(task);
    }

    async deleteTask(taskId) {
        return await this.taskRepository.deleteTask(taskId);
    }
}

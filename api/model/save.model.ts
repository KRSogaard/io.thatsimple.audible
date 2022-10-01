import { model, Schema, Model, Document } from 'mongoose';

export interface ISave extends Document {
    task: string;
    assignee: string;
    status: string;
    createDate: Date, 
    updatedDate: Date;
    createdBy: string;
    updatedBy: string;
    timestamps?: {};
}

const SaveSchema: Schema = new Schema({
    task: { type: String, required: true },
    assignee: { type: String, required: true },
    status: { type: String, required: true },
    createDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
    createdBy: { type: String, required: false },
    updatedBy: { type: String, required: false },
    timestamps: { createDate: Date, updatedDate: Date}}
);

export const SaveModel: Model<ISave> = model<ISave>('saves', SaveSchema);
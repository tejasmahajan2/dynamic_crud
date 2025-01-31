import { Model, Document } from "mongoose";

export class GenericService<T extends Document> {
  constructor(private model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async findAll(): Promise<T[]> {
    return this.model.find().exec();
  }

  async findOne(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}

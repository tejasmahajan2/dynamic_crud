import { Document } from 'mongoose';

// Interface for shared fields
export interface IGenericSchema extends Document {
  createdAt: Date;
  modifiedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}
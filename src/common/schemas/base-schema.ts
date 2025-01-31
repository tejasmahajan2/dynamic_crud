import { Document } from 'mongoose';

// Interface for shared fields
export interface IBaseSchema extends Document {
  createdAt: Date;
  modifiedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

// Reusable base fields for other schemas
export const BaseSchemaFields = {
  createdAt: { type: Date, default: () => new Date() },
  modifiedAt: { type: Date, default: () => new Date() },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, required: false, default: null },
};

// Reusable base fields for other schemas
export const GenericSchemaFields = {
  createdAt: { type: Date, default: () => new Date() },
  modifiedAt: { type: Date, default: () => new Date() },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, required: false, default: null },
};

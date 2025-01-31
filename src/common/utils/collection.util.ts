import mongoose from "mongoose";
import { BaseSchemaFields } from "../schemas/base-schema";

export const collections = {
    projects: mongoose.connection.collection("projects"),
}

export function getOrCreateModel(collectionName: string) {
    // Create a generic schema and models
    let DynamicModel = mongoose.models[collectionName];
    if (!DynamicModel) {
        const dynamicSchema = new mongoose.Schema(BaseSchemaFields, { strict: false });
        DynamicModel = mongoose.model(collectionName, dynamicSchema, collectionName);
    }

    return DynamicModel;
}

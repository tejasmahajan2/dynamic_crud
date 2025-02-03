import mongoose from "mongoose";
import { GenericSchemaFields } from "../schemas/generic.schema";

export const collections = {
    projects: mongoose.connection.collection("projects"),
    schemas: mongoose.connection.collection("schema"),
}

export function getOrCreateModel(collectionName: string) {
    // Create a generic schema and models
    let DynamicModel = mongoose.models[collectionName];
    if (!DynamicModel) {
        const dynamicSchema = new mongoose.Schema(GenericSchemaFields, { strict: false });
        DynamicModel = mongoose.model(collectionName, dynamicSchema, collectionName);
    }

    return DynamicModel;
}

import dotenv from "dotenv";
dotenv.config({});

import express, { Request, Response } from "express";
import mongoose from "mongoose";
import connectDB from "./config/database.config";
import cors from "cors";
import { GenericService } from "./common/services/generic-crud.service";
import { getOrCreateModel } from "./common/utils/collection.util";
import { GenericController } from "./common/controllers/generic-crud.controller";
var removeRoute = require('express-remove-route');

const app = express();
const port = process.env.PORT || 3000;

// middlwares
app.use(express.json());
app.use(cors());

connectDB();

const ProjectSchema = new mongoose.Schema({
  name: String,
  modules: [{ name: String, fields: [String] }]
});

const Projects = mongoose.model("projects", ProjectSchema);

// Store active routes
const dynamicRoutes = new Map<string, express.Router>();

// Function to reload API routes dynamically
const reloadRoutes = async () => {

  const projects = await Projects.find();

  projects.forEach((project) => {
    project.modules.forEach((module) => {
      const routePath = `/${project.name}/${module.name}`;
      const modelName = `${project.name}_${module.name}`;

      // Remove old route if it exists
      if (dynamicRoutes.has(routePath)) {
        app._router.stack = app._router.stack.filter((layer: any) => layer.route?.path !== routePath);
        dynamicRoutes.delete(routePath);
        removeRoute(app, modelName);
      }

      const model = getOrCreateModel(modelName);
      const service = new GenericService(model);
      const controller = new GenericController(service);
      const router = controller.getRoutes();
      app.use(routePath, router);
      dynamicRoutes.set(routePath, router);
    });
  });
};

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/health", (req: Request, res: Response) => {
  res.send("Service is healthy.");
});

// ** Watch for MongoDB changes (Insert, Update, Delete) **
// const watchDatabaseChanges = () => {
//   const changeStream = Project.watch();

//   changeStream.on("change", async (change) => {
//     console.log("Database Change Detected:", change);
//     await reloadRoutes();
//   });
// };

const watchDatabaseChanges = () => {
  const changeStream = Projects.watch([], {
    fullDocumentBeforeChange: "whenAvailable",
  });

  changeStream.on("change", async (change) => {
    if (change.operationType === "delete") {
      const deletedDoc = change.fullDocumentBeforeChange;
      const moduleNames = deletedDoc.modules.map((mod : any) => mod.name);
      for (const moduleName of moduleNames) {
        const modelName = `${deletedDoc.name}_${moduleName}`;
        mongoose.connection.dropCollection(modelName);
        removeRoute(app, modelName);
      }
    }

    await reloadRoutes();
  });
};

// Initial load of routes
reloadRoutes().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    watchDatabaseChanges(); // Start watching for changes
  });
});



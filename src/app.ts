import dotenv from "dotenv";
dotenv.config({});

import express, { Request, Response } from "express";
import mongoose from "mongoose";
import connectDB from "./config/database.config";
import cors from "cors";
import { GenericService } from "./common/services/generic-crud.service";
import { getOrCreateModel } from "./common/utils/collection.util";
import { GenericController } from "./common/controllers/generic-crud.controller";

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

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/health", (req: Request, res: Response) => {
  res.send("Service is healthy.");
});

const removeRoute = (path: string) => {
  app._router.stack = app._router.stack.filter((layer: any) => {
    if (!layer.route) return true; // Ignore non-route layers (middleware)
    return layer.route.path !== path;
  });

  console.log(`Removed route: ${path}`);
};

removeRoute('/health');

// Function to reload API routes dynamically
const reloadRoutes = async () => {
  // Clear all existing routes first (wipe out the app._router.stack)
  app._router.stack = app._router.stack.filter((layer: any) => !layer.route);

  const projects = await Projects.find();

  projects.forEach((project) => {
    project.modules.forEach((module) => {
      const routePath = `/${project.name}/${module.name}`;
      const modelName = `${project.name}_${module.name}`;

      // Remove old route if it exists
      if (dynamicRoutes.has(routePath)) {
        app._router.stack = app._router.stack.filter((layer: any) => layer.route?.path !== routePath);
        dynamicRoutes.delete(routePath);
      }

      // Create new route and add it dynamically
      const _router = express.Router();
      _router.get("/", (req: Request, res: Response) => {
        res.send(`This is the ${module.name} route of ${project.name}`);
      });
      dynamicRoutes.set(routePath, _router);

      const model = getOrCreateModel(modelName);
      const service = new GenericService(model);
      const controller = new GenericController(service);
      const router = controller.getRoutes();
      dynamicRoutes.set(routePath, router);
      app.use(routePath, router);
    });
  });
};

// ** Watch for MongoDB changes (Insert, Update, Delete) **
const watchDatabaseChanges = () => {
  const changeStream = Projects.watch([], {
    fullDocumentBeforeChange: "whenAvailable",
  });

  changeStream.on("change", async (change) => {
    if (change.operationType === "delete") {
      const deletedDoc = change.fullDocumentBeforeChange;
      const moduleNames = deletedDoc.modules.map((mod: any) => mod.name);

      for (const moduleName of moduleNames) {
        const modelName = `${deletedDoc?.name}_${moduleName}`;
        mongoose.connection.dropCollection(modelName);

        const routePath = `/${deletedDoc?.name}/${moduleName}`;
        console.log(`Deleting : ${routePath}`);

        // Remove the route from dynamicRoutes map if it exists
        dynamicRoutes.delete(routePath);

        // Log remaining routes to verify removal
        console.log("Remaining Routes:", app._router.stack.map((layer: any) => layer.route?.path).filter(Boolean));

        // Filter the app._router.stack to remove the route
        app._router.stack = app._router.stack.filter((layer: any) => {
          if (!layer.route) return true; // Ignore non-route layers (middleware)
          return layer.route.path !== routePath;
        });

        console.log(`Removed route: ${routePath}`);
      }
    }

    // After deleting a route, reload the other routes (if any)
    await reloadRoutes();
  });
};


// Initial load of routes
reloadRoutes().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    watchDatabaseChanges(); // Start watching for changes
    
    app._router.stack = app._router.stack.filter((layer: any) => {
      if (!layer.route) return true; // Ignore non-route layers (middleware)
      return layer.route.path !== "/y/products";
    });

  });
});



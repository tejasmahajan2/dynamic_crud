import dotenv from "dotenv";
dotenv.config({});

import express from "express";
import mongoose from "mongoose";
import connectDB from "./config/database.config";
import cors from "cors";

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

// Function to create CRUD routes dynamically
const generateCrudController = (moduleName: string) => {
  const router = express.Router();

  router.get("/", (req, res) => {
    res.json({ message: `Fetching all ${moduleName} records` });
  });

  router.post("/", (req, res) => {
    res.json({ message: `Creating a new ${moduleName} record`, data: req.body });
  });

  router.get("/:id", (req, res) => {
    res.json({ message: `Fetching ${moduleName} with ID: ${req.params.id}` });
  });

  router.put("/:id", (req, res) => {
    res.json({ message: `Updating ${moduleName} with ID: ${req.params.id}`, data: req.body });
  });

  router.delete("/:id", (req, res) => {
    res.json({ message: `Deleting ${moduleName} with ID: ${req.params.id}` });
  });

  return router;
};

// Function to reload API routes dynamically
const reloadRoutes = async () => {

  const projects = await Projects.find();

  projects.forEach((project) => {
    project.modules.forEach((module) => {
      const routePath = `/${project.name}/${module.name}`;

      // Remove old route if it exists
      if (dynamicRoutes.has(routePath)) {
        app._router.stack = app._router.stack.filter((layer: any) => layer.route?.path !== routePath);
        dynamicRoutes.delete(routePath);
      }

      // Create new route
      const router = generateCrudController(module?.name || 'student');
      app.use(routePath, router);
      dynamicRoutes.set(routePath, router);
    });
  });
};

// ** Watch for MongoDB changes (Insert, Update, Delete) **
const watchDatabaseChanges = () => {
  const changeStream = Projects.watch();

  changeStream.on("change", async (change) => {
    console.log("Database Change Detected:");
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



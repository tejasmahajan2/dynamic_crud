import { Document } from "mongoose";
import { GenericService } from "../services/generic-crud.service";
import express, { NextFunction, Request, Response, Router } from "express";

export class GenericController<T extends Document> {
  // public router: Router;

  constructor(private service: GenericService<T>) {
    // this.router = this.getRoutes();
    // this.initializeRoutes();
  }

  // private initializeRoutes() {
  // this.router.post("/", this.create.bind(this));
  // this.router.get("/", this.findAll.bind(this));
  // this.router.get("/:id", this.findOne.bind(this));
  // this.router.put("/:id", this.update.bind(this));
  // this.router.delete("/:id", this.delete.bind(this));
  // }

  public getRoutes(): express.Router {
    let appRoutes = express.Router({ mergeParams: true });

    appRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await this.service.create(req.body);
        res.status(201).json(data);
      } catch (error) {
        res.status(400).json({ error: 'Internal server error' });
      }
    });

    appRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await this.service.findAll();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });


    appRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const data = await this.service.findOne(req.params.id);
        if (!data) return res.status(404).json({ message: "Not found" });
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    appRoutes.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const data = await this.service.update(req.params.id, req.body);
        if (!data) return res.status(404).json({ message: "Not found" });
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    appRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const data = await this.service.delete(req.params.id);
        if (!data) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });


    return appRoutes;
  }
}

import { Document } from "mongoose";
import { GenericService } from "../services/generic-crud.service";
import express, { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

export class GenericController<T extends Document> {

  constructor(private service: GenericService<T>) { }

  public getRoutes(): express.Router {
    let appRoutes = express.Router({ mergeParams: true });

    appRoutes.post('/', this.validateSchema, async (req: Request, res: Response, next: NextFunction) => {
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

    appRoutes.get('/:id', this.validateId, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const data = await this.service.findOne(req.params.id);
        if (!data) return res.status(404).json({ message: "Not found" });
        res.json(data);
      } catch (error: any) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    appRoutes.put('/:id', this.validateId, this.validateSchema, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const data = await this.service.update(req.params.id, req.body);
        if (!data) return res.status(404).json({ message: `Not found` });
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: `Unexpected error occured during update.` });
      }
    });

    appRoutes.delete('/:id', this.validateId, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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

  validateId(req: Request, res: Response, next: NextFunction) {
    if (!Types.ObjectId.isValid(req.params.id)) res.status(404).json({ message: "Invalid object id." });
    else next();
  }

  validateSchema(req: Request, res: Response, next: NextFunction) {
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Request body is empty!" });
    } else {
      next();
    }
  }

  private extractSecondSegment(url: string) {
    const match = url.match(/^(?:\/?[^\/]+)?\/([^\/]+)/);
    return match ? match[1] : null;
  };
}

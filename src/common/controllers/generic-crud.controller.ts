import { GenericService } from "../services/generic-crud.service";
import express, { NextFunction, Request, RequestHandler, Response } from "express";
import { Types } from "mongoose";
import { ValidateFunction } from "ajv";
import { IGenericSchema } from "../interfaces/generic.interface";

export class GenericController<T extends IGenericSchema> {
  private validator?: ValidateFunction;
  private beforeReq: RequestHandler;
  private afterReq: RequestHandler;

  constructor(
    private service: GenericService<T>,
    validator?: ValidateFunction,
    beforeReq: RequestHandler = (req, res, next) => next(),
    afterReq: RequestHandler = (req, res, next) => next()
  ) {
    this.validator = validator;
    this.beforeReq = beforeReq;
    this.afterReq = afterReq;
  }

  public getRoutes(): express.Router {
    let appRoutes = express.Router({ mergeParams: true });

    appRoutes.post(
      "/",
      this.beforeReq,
      this.validateSchema.bind(this),
      this.afterReq, // ✅ Logs response before sending
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const data = await this.service.create(req.body);
          res.status(201).json(data);
        } catch (error) {
          res.status(500).json({ error: `Unexpected error occured during creation.` });
        }
      });

    appRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await this.service.findAll();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: `Unexpected error occured during retrieval.` });
      }
    });

    appRoutes.get('/:id', this.validateId, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
      try {
        const data = await this.service.findOne(req.params.id);
        if (!data) return res.status(404).json({ message: "Not found" });
        res.json(data);
      } catch (error: any) {
        res.status(500).json({ error: `Unexpected error occured during retrieval.` });
      }
    });

    appRoutes.put('/:id', this.validateId, this.validateSchema.bind(this), async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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
        res.status(500).json({ error: `Unexpected error occured during deletion.` });
      }
    });

    return appRoutes;
  }

  private validateId(req: Request, res: Response, next: NextFunction) {
    if (!Types.ObjectId.isValid(req.params.id)) res.status(404).json({ message: "Invalid object id." });
    else next();
  }

  private validateSchema(req: Request, res: Response, next: NextFunction): any {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body is empty!" });
    }

    if (!this?.validator) {
      return next();
    }

    const isValid = this.validator(req.body);
    if (!isValid) {
      return res.status(400).json({ errors: this.validator.errors });
    }

    next();
  }

  private extractSecondSegment(url: string) {
    const match = url.match(/^(?:\/?[^\/]+)?\/([^\/]+)/);
    return match ? match[1] : null;
  };
}

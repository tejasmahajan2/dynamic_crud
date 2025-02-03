import { Request, Response, NextFunction, RequestHandler } from "express"

export const defaultMiddlewareFunction = ((req: Request, res: Response, next: NextFunction) => next());

export const createMiddleware = (funcString: string | null | undefined): RequestHandler => {
    try {
        // Log the incoming function string
        console.log("Compiling middleware function:", funcString);

        // Compile the function dynamically
        const fn = new Function('req', 'res', 'next', `
        try {
          ${funcString}
          next();
        } catch (error) {
          console.error("Error in dynamic middleware:", error);
          next(); // Handle errors if needed
        }
      `)();

        // Log the compiled function (only the core logic, not extra layers)
        console.log("Compiled function:", fn.toString());

        return fn as RequestHandler;
    } catch (error) {
        console.error("Error creating middleware:", error);
        return (req, res, next) => next(); // Return a default no-op function in case of error
    }
};


export const beforeReq: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    console.log(`Before Req : ${JSON.stringify(req.body)}`);
    next();
};

export const afterReq: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    // Store the original res.json function
    const originalJson = res.json;

    res.json = function (data: any) {
        console.log(`After Req - Response Data: ${JSON.stringify(data)}`); // Log response

        return originalJson.call(this, data); // Send the original response
    };

    next();
};
import { Request, Response, NextFunction } from "express";

const CatchAsyncError = (thefunc: any) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(thefunc(req, res, next)).catch(next);
    };
export default CatchAsyncError;
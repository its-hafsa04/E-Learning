import { NextFunction } from "express";
import ErrorHandler from "../utils/errorhandler";

export const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    //wrong mongoose Id
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }
    //mongoose duplicate key error
    if (err.code === 11000) {
        const message = `Duplicate field value entered: ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message, 400);
    }
    //wrong JWT error
    if (err.name === "JsonWebTokenError") {
        const message = `Json Web Token is invalid, try again`;
        err = new ErrorHandler(message, 400);
    }
    //JWT Expired error
    if (err.name === "TokenExpiredError") {
        const message = `Json Web Token is expired, try again`;
        err = new ErrorHandler(message, 400);
    }
    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
}
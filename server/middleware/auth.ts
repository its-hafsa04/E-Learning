require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import CatchAsyncError from "./catchAsyncErrors";
import ErrorHandler from "../utils/errorhandler";
import jwt from "jsonwebtoken";
import { redis } from "../utils/redis";

// Middleware to check if user is authenticated
// This middleware checks if the user is authenticated by verifying the access token
export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        return next(new ErrorHandler("Please login to access this resource", 401));
    }
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN as string) as { id: string };
    if (!decoded || !decoded.id) {
        return next(new ErrorHandler("Invalid access token", 401));
    }
    // Check if user exists in Redis bcz we store user data in Redis
    const user = await redis.get(decoded.id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }
    req.user = JSON.parse(user);
    next();
});

// validate user roles
export const isAuthorized = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role)) {
            return next(new ErrorHandler(`${req.user?.role} is not authorized to access this resource`, 403));
        }
        next();
    };
};
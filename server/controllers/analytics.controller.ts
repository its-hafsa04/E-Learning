import { Request,Response,NextFunction } from "express";
import CatchAsyncError from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorhandler";
import {generateLast12MonthData} from "../utils/analytics.generate"
import userModel from "../model/user.model";
import CourseModel from "../model/course.model";
import OrderModel from "../model/order.model";

//get User Analytics only for admin
export const getUserAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await generateLast12MonthData(userModel);
        
        res.status(200).json({
            success: true,
            users,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

//get courses Analytics only for admin
export const getCoursesAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courses = await generateLast12MonthData(CourseModel);

        res.status(200).json({
            success: true,
            courses,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

//get order Analytics only for admin
export const getOrderAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await generateLast12MonthData(OrderModel);
        
        res.status(200).json({
            success: true,
            orders,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});
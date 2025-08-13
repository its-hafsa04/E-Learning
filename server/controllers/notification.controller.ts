import { Request,Response,NextFunction } from "express";
import CatchAsyncError from "../middleware/catchAsyncErrors";
import { IOrder } from "../model/order.model";
import NotificationModel from "../model/notification.model";
import ErrorHandler from "../utils/errorhandler";
import nodeCron from "node-cron";

//get all notifications for admin only
export const getNotifications = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notifications = await NotificationModel.find().sort({ createdAt: -1 }); // Fetch all notifications sorted by creation date in descending order

        res.status(200).json({
            success: true,
            notifications,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

//update notification status
export const updateNotification = CatchAsyncError(async (req: Request, res: Response,
    next: NextFunction) => {
    try {

        const notification = await NotificationModel.findById(req.params.id);

        if (!notification) {
            return next(new ErrorHandler("Notification not found", 404));
        } else {
            notification.status ? notification.status = "read" : notification.status = "unread";
        }
        await notification.save();
        // updated notifications 
        const notifications = await NotificationModel.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            notifications
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

//delete notification only for admin
nodeCron.schedule("0 0  0 * * *", async () => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        await NotificationModel.deleteMany({ status:"read",createdAt: { $lt: thirtyDaysAgo } });
        console.log("Old notifications deleted successfully");
})

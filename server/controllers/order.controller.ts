import { Request, Response, NextFunction } from "express";
import CatchAsyncError from "../middleware/catchAsyncErrors";
import { IOrder } from "../model/order.model";
import userModel from "../model/user.model";
import CourseModel from "../model/course.model";
import ErrorHandler from "../utils/errorhandler";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../model/notification.model";
import {newOrder} from "../services/order.service";

export const createOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, payment_info } = req.body as IOrder;

        // Check if the user exists
        const user = await userModel.findById(req.user?._id);

        //check if course exists
        const courseExistInUser = await user?.courses.some((course: any) => course._id === courseId);
        if (courseExistInUser) {
            return next(new ErrorHandler("You have already purchased this course", 400));
        }

        // Check if the course exists
        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        // Create the order
        const data: any = {
            courseId: course._id,
            userId: user?._id,
            payment_info,
        };
        const mailData = {
            order: {
                _id: course.id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
            }
        };
        const html = await ejs.renderFile(path.join(__dirname, "../mails/order-confirm.ejs"), { order: mailData });

        try {
            if (user) {
                // Send confirmation email
                await sendMail({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirm.ejs",
                    data: mailData,
                });
            }
            user?.courses.push(course?.id);
            await user?.save();
            // Create a notification for the user
            await NotificationModel.create({
                userId: user?._id,
                title: "New Order",
                message: `You have successfully purchased the course: ${course.name}`,
            });

            // Update the course purchased count
            if (course.purchased) {
                course.purchased += 1;
            }
            await course.save();
            newOrder(data, res, next);

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));

        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});
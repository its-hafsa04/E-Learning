require("dotenv").config();
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRoutes from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRoute from "./routes/analytics.route";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: process.env.ORIGIN,
  credentials: true,
}));

// Import routes
app.use("/api/v1", userRouter, courseRouter, orderRoutes, notificationRouter, analyticsRoute);


// Test route
app.get("/test", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Api is running"
  });
});

app.use(ErrorMiddleware);

// // Unknown route handler
// app.all("*", (req: Request, res: Response, next: NextFunction) => {
//   const err = new Error(`Can't find ${req.originalUrl} on this server!`) as any;
//   err.statusCode = 404;
//   next(err);
// });

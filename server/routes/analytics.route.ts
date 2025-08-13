import express from "express";
import { getCoursesAnalytics, getOrderAnalytics, getUserAnalytics } from "../controllers/analytics.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const analyticsRoute = express.Router();

analyticsRoute.get("/get-users-analytics", isAuthenticated, authorizeRoles("admin"), getUserAnalytics);
analyticsRoute.get("/get-courses-analytics", isAuthenticated, authorizeRoles("admin"), getCoursesAnalytics);
analyticsRoute.get("/get-orders-analytics", isAuthenticated, authorizeRoles("admin"), getOrderAnalytics);

export default analyticsRoute;

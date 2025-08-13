import express from "express";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";
import { getNotifications, updateNotification } from "../controllers/notification.controller";

const notificationRouter = express.Router();

notificationRouter.get("/get-all-notifications", isAuthenticated, authorizeRoles("admin"), getNotifications);
notificationRouter.put("/updated-notifications/:id", isAuthenticated, authorizeRoles("admin"), updateNotification);

export default notificationRouter;
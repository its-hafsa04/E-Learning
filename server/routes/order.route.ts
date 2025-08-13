import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAllOrders } from "../controllers/order.controller";

const orderRoutes = express.Router();

orderRoutes.post("/create-order", isAuthenticated, createOrder);
orderRoutes.get("/get-orders", isAuthenticated, authorizeRoles("admin") , getAllOrders);

export default orderRoutes;
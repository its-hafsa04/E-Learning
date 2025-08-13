import express from "express";
import { isAuthenticated } from "../middleware/auth";
import { createOrder } from "../controllers/order.controller";

const orderRoutes = express.Router();

orderRoutes.post("/create-order", isAuthenticated, createOrder);

export default orderRoutes;
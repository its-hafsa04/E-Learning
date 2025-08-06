import userModel from "../model/user.model";
import { Response } from "express";
import { redis } from "../utils/redis";

//get user by id
export const userById = async (id: string, res: Response) => {
const userjson = await redis.get(id);
if (userjson) {
const user = JSON.parse(userjson);
res.status(200).json({
    success: true,
    user,
});
}
};
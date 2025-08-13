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
//get all users
export const getAllUsersService = async (res: Response) => {
    const users = await userModel.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        users,
    });
};
//update user role
export const updateUserRoleService = async (id: string, role: string, res: Response) => {
    const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });
    return res.status(200).json({
        success: true,
        user,
    });
};


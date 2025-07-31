require("dotenv").config();
import { Response } from "express";
import { IUser } from "../model/user.model";
import { redis } from "./redis";

interface ITokenOptions {
    expiresIn: Date;
    maxAge: number;
    httpOnly: boolean;
    secure?: boolean;
    sameSite: "strict" | "lax" | "none" | undefined;
}
export const sendToken = (
    user: IUser,
    statusCode: number,
    res: Response
) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    //upload session to redis
    redis.set(user._id, JSON.stringify(user) as any);


    //parse envs to integrate with fallback values
    const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "300", 10);
    const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1200", 10);

    // Set cookie options
    const accessTokenOptions: ITokenOptions = {
        expiresIn: new Date(Date.now() + accessTokenExpire * 1000),
        maxAge: accessTokenExpire * 1000,
        httpOnly: true,
        sameSite: "lax",
    };

    const refreshTokenOptions: ITokenOptions = {
        expiresIn: new Date(Date.now() + refreshTokenExpire * 1000),
        maxAge: refreshTokenExpire * 1000,
        httpOnly: true,
        sameSite: "lax",
    };

    //only set secure flag if in production
    if (process.env.NODE_ENV === "production") {
        accessTokenOptions.secure = true;
    }
    res.cookie("accessToken", accessToken, accessTokenOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenOptions);
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
    });


};
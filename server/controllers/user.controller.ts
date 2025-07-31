require("dotenv").config();
import e, { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../model/user.model";
import ErrorHandler from "../utils/errorhandler";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import jwt from "jsonwebtoken";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import { sendToken } from "../utils/jwt";

//register user
interface IRegistration {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registerUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        const isEmailExist = await userModel.findOne({ email });

        if (isEmailExist) {
            return next(new ErrorHandler("Email already exists", 400));
        }

        const user: IRegistration = {
            name,
            email,
            password,
        };

        const activationToken = createActivationToken(user);
        const activationCode = activationToken.activationCode;
        const data = {
            user: {
                name: user.name
            },
            activationCode
        };
        const html = await ejs.renderFile(
            path.join(__dirname, "../mails/activation-mail.ejs"), data);


        try {
            await sendMail({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data,
            });
            res.status(201).json({
                success: true,
                message: `Activation email sent to ${user.email} to activate your account.`,
                activationToken: activationToken.token,
            });
        }
        catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }

    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
}
);

interface IActivationToken {
    token: string;
    activationCode: string;
}
const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = jwt.sign({ user, activationCode }, process.env.ACTIVATION_SECRET as string, {
        expiresIn: "15m",
    });
    return { token, activationCode };
}

//activate user
interface IActivationRequest {
    activationToken: string;
    activationCode: string;
}
export const activateUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { activationToken, activationCode } = req.body as IActivationRequest;
        const newUser: { user: IUser, activationCode: string } = jwt.verify(activationToken, process.env.ACTIVATION_SECRET as string) as { user: IUser, activationCode: string };
        if (newUser.activationCode !== activationCode) {
            return next(new ErrorHandler("Invalid activation code", 400));
        }
        const { name, email, password } = newUser.user;
        const existUser = await userModel.findOne({ email });
        if (existUser) {
            return next(new ErrorHandler("User already exists", 400));
        }
        const user = await userModel.create({
            name,
            email,
            password,
        });
        res.status(201).json({
            success: true,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

//user login
interface ILoginRequest {
    email: string;
    password: string;
}
export const loginUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body as ILoginRequest;
        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400));
        }
        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 401));
        }
        const isPasswordMatched = await user.comparePassword(password);
        if (!isPasswordMatched) {
            return next(new ErrorHandler("Invalid email or password", 401));
        }
        sendToken(user, 200, res);

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

//logout user
export const logoutUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie("accessToken", "", { maxAge: 1 });
        res.cookie("refreshToken", "", { maxAge: 1 });
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
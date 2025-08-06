require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../model/user.model";
import ErrorHandler from "../utils/errorhandler";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import { refreshTokenOptions, sendToken, accessTokenOptions } from "../utils/jwt";
import { redis } from "../utils/redis";
import { userById } from "../services/user.service";
import cloudinary from "cloudinary";

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

        // Remove user session from Redis
        const userId = req.user?._id as string;
        redis.del(userId);

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// update access token
export const updateAccessToken = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies.refreshToken as string;
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN as string) as JwtPayload;
        const message = "Could not refresh access token";
        if (!decoded) {
            return next(new ErrorHandler(message, 401));
        }
        // Check if user exists in Redis
        const session = await redis.get(decoded.id as string);
        if (!session) {
            return next(new ErrorHandler(message, 404));
        }
        const user = JSON.parse(session);

        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, { expiresIn: "15m" });
        const refresh_Token = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, { expiresIn: "7d" });

        req.user = user;

        res.cookie("accessToken", accessToken, accessTokenOptions);
        res.cookie("refreshToken", refresh_Token, refreshTokenOptions);

        res.status(200).json({
            status: "success",
            accessToken,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

//get user info
export const getUserInfo = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id as string;

        userById(userId, res);

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface ISocialAuth {
    email: string;
    name: string;
    avatar: string;
}

// social auth
export const socialAuth = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, name, avatar } = req.body as ISocialAuth;
        const user = await userModel.findOne({ email });
        if (!user) {
            const newUser = await userModel.create({ email, name, avatar });
            sendToken(newUser, 200, res);
        } else {
            sendToken(user, 200, res);
        }
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

//update user info
interface IUpdateUser {
    name?: string;
    email?: string;
}
export const updateUserInfo = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email } = req.body as IUpdateUser;
        const userId = req.user?._id;
        const user = await userModel.findById(userId);

        if (name && email) {
            const isEmailExist = await userModel.findOne({ email });
            if (isEmailExist) {
                return next(new ErrorHandler("Email already exists", 400));
            }
            user.email = email;
        }
        if (name) {
            user.name = name;
        }
        await user?.save();

        // Update user in Redis
        await redis.set(userId as string, JSON.stringify(user));
        // Return updated user info
        res.json({
            success: true,
            message: "User info updated successfully",
            user
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// update user password
interface IUpdatePassword {
    oldPassword: string;
    newPassword: string;
}
export const updatePassword = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { oldPassword, newPassword } = req.body as IUpdatePassword;

        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler("Please enter old and new password", 400));
        }

        const user = await userModel.findById(req.user?._id).select("+password");
        if (user?.password === undefined) {
            return next(new ErrorHandler("Invalid User", 404));
        }
        const isPasswordMatched = await user?.comparePassword(oldPassword);
        if (!isPasswordMatched) {
            return next(new ErrorHandler("Old password is incorrect", 400));
        }

        user.password = newPassword;
        await user.save();
        await redis.set(req.user?._id, JSON.stringify(user));

        res.status(201).json({
            success: true,
            user,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// update user avatar
interface IUpdateAvatar {
    avatar: string;
}
export const updateAvatar = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { avatar } = req.body as IUpdateAvatar;
        const userId = req.user?._id;
        const user = await userModel.findById(userId);

        if (avatar && user) {
            //if user has avatar then go to if block
            if (user?.avatar?.public_id) {
                // Delete old avatar from cloudinary
                await cloudinary.v2.uploader.destroy(user.avatar.public_id);

                // Upload new avatar to cloudinary
                const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                };

            } else {
                const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                };
            }
        }
        await user.save();

        await redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: "Avatar updated successfully",
            user
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
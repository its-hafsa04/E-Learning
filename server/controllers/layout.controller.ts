import CatchAsyncError from "../middleware/catchAsyncErrors";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorhandler";
import LayoutModel from "../model/layout.model";
import cloudinary from "cloudinary";

//create layout
export const createLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

        // Check duplicate
        const isTypeExist = await LayoutModel.findOne({ type });
        if (isTypeExist) {
            return next(new ErrorHandler(`${type} already exists`, 400));
        }

        if (type === "banner") {
            const { image, title, subTitle } = req.body;
            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder: "layout",
            });

            const banner = {
                type,
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                },
                title,
                subTitle,
            };
            await LayoutModel.create(banner);
        }

        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = faq.map((item: any) => ({
                question: item.question,
                answer: item.answer
            }));
            await LayoutModel.create({ type: "FAQ", faq: faqItems });
        }

        if (type === "Categories") {
            const { categories } = req.body;
            const categoriesItems = categories.map((item: any) => ({
                title: item.title
            }));
            await LayoutModel.create({ type: "Categories", categories: categoriesItems });
        }

        res.status(201).json({
            success: true,
            message: "Layout created successfully"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

//edit layout
export const editLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

        if (type === "banner") {
            const bannerData: any = await LayoutModel.findOne({ type: "Banner" })
            const { image, title, subTitle } = req.body;
            if (bannerData) {
                await cloudinary.v2.uploader.destroy(bannerData.image.public_id);
            }
            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder: "layout",
            });
            const banner = {
                type,
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                },
                title,
                subTitle,
            };
            await LayoutModel.findByIdAndUpdate(bannerData.id, { banner });
        }

        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItem = await LayoutModel.findOne({ type: "FAQ" })
            const faqItems = faq.map((item: any) => ({
                question: item.question,
                answer: item.answer
            }));
            await LayoutModel.findByIdAndUpdate(faqItem?._id, { type: "FAQ", faq: faqItems });
        }

        if (type === "Categories") {
            const { categories } = req.body;
            const categoryItem = await LayoutModel.findOne({ type: "Categories" })
            const categoriesItems = categories.map((item: any) => ({
                title: item.title
            }));
            await LayoutModel.findByIdAndUpdate(categoryItem?._id, { type: "Categories", categories: categoriesItems });
        }

        res.status(201).json({
            success: true,
            message: "Layout edit successfully"
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

//get layout by type
export const getLayoutByType = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
try {
    
    const {type} = req.body;
    const layout = await LayoutModel.findOne({type});
    res.status(201).json({
        success: true,
        layout
    });

} catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
};
});
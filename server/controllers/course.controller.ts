import { Request, Response, NextFunction } from "express";
import CourseModel from "../model/course.model";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/errorhandler";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import { createCourse, getAllCoursesService } from "../services/course.service";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import NotificationModel from "../model/notification.model";

// upload course
export const uploadCourse = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      // Upload thumbnail to Cloudinary
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// edit course
export const editCourse = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      const courseId = req.params.id;
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course without purchase
export const getSingleCourse = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExist = await redis.get(courseId);

      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        return res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoURL -courseData.suggestions -courseData.questions -courseData.links"
        );
        await redis.set(courseId, JSON.stringify(course));
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses without purchase
export const getAllCourses = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("allCourses");

      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist);
        return res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoURL -courseData.suggestions -courseData.questions -courseData.links"
        );

        await redis.set("allCourses", JSON.stringify(courses));

        res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get courses content for valid users
export const getCourseContent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      const courseExists = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      );
      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 400)
        );
      }
      const course = await CourseModel.findById(courseId);
      const content = course?.courseData;
      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get questions for course
interface IQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}
export const addQuestions = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IQuestionData = req.body;

      const course = await CourseModel.findById(courseId);
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Content not found", 404));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("ContentId not found", 404));
      }

      //create new question object
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };
      // Add the question to the course content
      courseContent.questions.push(newQuestion);

      // Create a notification for the user
      await NotificationModel.create({
        user: req.user?._id,
        title: "New Question Received",
        message: `You have asked a question in the course: ${courseContent.title}`,
      });
      // Save the updated course
      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//add answer in course question
interface IAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}
export const addAnswer = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAnswerData = req.body;

      const course = await CourseModel.findById(courseId);
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Content not found", 404));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("ContentId not found", 404));
      }

      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );
      if (!question) {
        return next(new ErrorHandler("Question not found", 404));
      }

      // Create new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
      };
      // Add the answer to the question
      question.questionReplies.push(newAnswer);
      // Save the updated course
      await course?.save();

      if (req.user?._id === question.user._id) {
        //create notification
        await NotificationModel.create({
          user: question.user._id,
          title: "Question Answered",
          message: `Your question in the course: ${courseContent.title} has been answered.`,
        });
      } else {
        //create notification for question owner
        const data = {
          user: question.user.name,
          title: courseContent.title,
        };
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        // send email notification
        try {
          await sendMail({
            email: question.user.email,
            subject: "Question replies",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
//add review in course
interface IReviewData {
  review: string;
  courseId: string;
  rating: number;
  userId: string;
}
export const addReview = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      //check if course exists in user's course list
      const courseExists = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      );
      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to review this course", 404)
        );
      }

      const course = await CourseModel.findById(courseId);
      const { review, rating, userId }: IReviewData = req.body;

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };
      course?.reviews.push(reviewData);
      let avg = 0;
      course?.reviews.forEach((item: any) => {
        avg += item.rating;
      });
      if (course) {
        course.ratings = avg / course.reviews.length; // calculate average rating as having 2 reviews 1 is 5 and 1 is 4 then average will be 4.5
      }
      await course?.save();
      const notification = {
        title: "New review received",
        message: `Your course "${course?.name}" has received a new review by ${req.user?.name}.`,
      };
      //create notification

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//add reply to review
interface IReplyData {
  reviewId: string;
  comment: string;
  courseId: string;
}
export const replyToReview = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reviewId, comment, courseId }: IReplyData = req.body;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      const review = course.reviews.find(
        (item: any) => item._id.toString() === reviewId
      );
      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }
      const replyData: any = {
        user: req.user,
        comment,
      };

     if (!review.commentReplies) {
        review.commentReplies = [];
      }

      review.commentReplies?.push(replyData);
      await course.save();
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get all course for admin only
export const getAllCourse = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        getAllCoursesService(res);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
//delete course
export const deleteCourse = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {id} = req.params;
        const course = await CourseModel.findById(id);
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }
        await course.deleteOne({id});

        res.status(200).json({
            success: true,
            course,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
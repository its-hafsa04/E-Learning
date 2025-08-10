import express from 'express';
import { addAnswer, addQuestions, addReview, editCourse, getAllCourses, getCourseContent, getSingleCourse, replyToReview, uploadCourse } from '../controllers/course.controller';
import { isAuthenticated, authorizeRoles } from '../middleware/auth';

const courseRouter = express.Router();

courseRouter.post('/create-course', isAuthenticated, authorizeRoles("admin"), uploadCourse);
courseRouter.put('/edit-course/:id', isAuthenticated, authorizeRoles("admin"), editCourse);
courseRouter.get('/get-course/:id', getSingleCourse);
courseRouter.get('/get-courses', getAllCourses);
courseRouter.get('/get-course-content/:id', isAuthenticated, getCourseContent);
courseRouter.put('/add-questions', isAuthenticated, addQuestions);
courseRouter.put('/add-answer', isAuthenticated, addAnswer);
courseRouter.put('/add-review/:id', isAuthenticated, addReview);
courseRouter.put('/reply-review', isAuthenticated, authorizeRoles("admin"), replyToReview);

export default courseRouter;
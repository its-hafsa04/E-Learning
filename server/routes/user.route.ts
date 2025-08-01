import express from 'express';
import { activateUser, loginUser, logoutUser, registerUser, } from '../controllers/user.controller';
import { isAuthenticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/activate', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout', isAuthenticated, logoutUser);

export default userRouter;
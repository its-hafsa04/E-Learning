import express from 'express';
import { activateUser, deleteUser, getAllUsers, getUserInfo, loginUser, logoutUser, registerUser, socialAuth, updateAccessToken, updateAvatar, updatePassword, updateUserInfo, updateUserRole } from '../controllers/user.controller';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/activate', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout', isAuthenticated, logoutUser);
userRouter.get('/refresh', updateAccessToken);
userRouter.get('/me', isAuthenticated, getUserInfo);
userRouter.post('/social', socialAuth);
userRouter.put('/update-user-info', isAuthenticated, updateUserInfo);
userRouter.put('/update-password', isAuthenticated, updatePassword);
userRouter.put('/update-avatar', isAuthenticated, updateAvatar);
userRouter.get('/get-users', isAuthenticated, authorizeRoles("admin"), getAllUsers);
userRouter.put('/update-user', isAuthenticated, authorizeRoles("admin"), updateUserRole);
userRouter.delete('/del-user/:id', isAuthenticated, authorizeRoles("admin"), deleteUser);

export default userRouter;
import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  getUserById,
  listUsers,
  listUsersForManagement,
  updateUserRole,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { registerSchema, loginSchema, updateUserRoleSchema, updateProfileSchema } from '../validations/v1/auth.validation';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfile);
router.get('/users', authenticate, listUsers);
router.get('/users/manage', authenticate, listUsersForManagement);
router.patch('/users/:id/role', authenticate, validate(updateUserRoleSchema), updateUserRole);
router.get('/users/:id', authenticate, getUserById);

export default router;

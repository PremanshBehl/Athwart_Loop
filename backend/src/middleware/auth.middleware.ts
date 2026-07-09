import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/db';
import { JwtPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { config } from '../config/env.config';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
        email: string;
        name: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid token', StatusCodes.UNAUTHORIZED, 'MISSING_TOKEN');
  }

  const token = authHeader.split(' ')[1];
  
  // jwt.verify throws JsonWebTokenError or TokenExpiredError 
  // which are automatically caught by our error.middleware
  const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

  req.user = {
    id: payload.userId,
    role: payload.role,
    email: payload.email,
    name: payload.name,
  };
  
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'FOUNDER') {
    throw new AppError('Forbidden. Admin access required.', StatusCodes.FORBIDDEN, 'FORBIDDEN');
  }
  next();
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      workerId?: string;
    }
  }
}

// -----------------------------
// USER AUTH MIDDLEWARE
// -----------------------------
export const autMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured in environment');
      return res.status(500).json({
        success: false,
        message: 'Server misconfiguration: missing JWT secret',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or malformed token',
      });
    }

    req.userId = decoded.userId;
    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired, please sign in again',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token',
    });
  }
};

// -----------------------------
// WORKER AUTH MIDDLEWARE
// -----------------------------
export const WorkerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.split(' ')[1];
    const WORKER_JWT_SECRET = process.env.WORKER_JWT_SECRET;

    if (!WORKER_JWT_SECRET) {
      console.error('❌ WORKER_JWT_SECRET not configured in environment');
      return res.status(500).json({
        success: false,
        message: 'Server misconfiguration: missing worker JWT secret',
      });
    }

    const decoded = jwt.verify(token, WORKER_JWT_SECRET) as { workerId?: string };

    if (!decoded || !decoded.workerId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or malformed worker token',
      });
    }

    req.workerId = decoded.workerId;
    next();
  } catch (err: any) {
    console.error('Worker middleware error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Worker session expired, please sign in again',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid worker token',
    });
  }
};

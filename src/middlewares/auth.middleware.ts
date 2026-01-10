import { Request, Response, NextFunction } from "express";
import { AuthUtils } from "../utils/auth.utils";
import { AppError } from "./error.middleware";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT access token
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError("Access token required", 401);
    }

    // Verify token
    const decoded = AuthUtils.verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError("Invalid or expired token", 401));
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = AuthUtils.verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

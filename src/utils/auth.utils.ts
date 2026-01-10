import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

const SALT_ROUNDS = 10;

export class AuthUtils {
  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  static generateAccessToken(userId: number, email: string): string {
    const payload = {
      userId,
      email,
      type: "access",
    };

    const secret = process.env.JWT_ACCESS_SECRET || "default-secret";
    const expiresIn = process.env.JWT_ACCESS_EXPIRY || "15m";

    return jwt.sign(payload, secret, { expiresIn } as any);
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(userId: number, email: string): string {
    const payload = {
      userId,
      email,
      type: "refresh",
    };

    const secret = process.env.JWT_REFRESH_SECRET || "default-refresh-secret";
    const expiresIn = process.env.JWT_REFRESH_EXPIRY || "7d";

    return jwt.sign(payload, secret, { expiresIn } as any);
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): { userId: number; email: string } {
    try {
      const secret = process.env.JWT_ACCESS_SECRET || "default-secret";
      const decoded = jwt.verify(token, secret) as {
        userId: number;
        email: string;
        type: string;
      };

      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      return { userId: decoded.userId, email: decoded.email };
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): { userId: number; email: string } {
    try {
      const secret = process.env.JWT_REFRESH_SECRET || "default-refresh-secret";
      const decoded = jwt.verify(token, secret) as {
        userId: number;
        email: string;
        type: string;
      };

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      return { userId: decoded.userId, email: decoded.email };
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): {
    valid: boolean;
    message?: string;
  } {
    if (password.length < 8) {
      return {
        valid: false,
        message: "Password must be at least 8 characters long",
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }

    if (!/[0-9]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one number",
      };
    }

    return { valid: true };
  }
}

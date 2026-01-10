import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { RegisterDTO, LoginDTO } from "../models/user.model";
import { asyncHandler } from "../middlewares/error.middleware";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /api/auth/register - Register new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name }: RegisterDTO = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Email and password are required",
          statusCode: 400,
        },
      });
    }

    const data: RegisterDTO = { email, password, name };
    const result = await this.authService.register(data);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  });

  /**
   * POST /api/auth/login - Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginDTO = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Email and password are required",
          statusCode: 400,
        },
      });
    }

    const data: LoginDTO = { email, password };
    const result = await this.authService.login(data);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  });

  /**
   * POST /api/auth/refresh - Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Refresh token is required",
          statusCode: 400,
        },
      });
    }

    const tokens = await this.authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      data: tokens,
    });
  });

  /**
   * POST /api/auth/logout - Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Refresh token is required",
          statusCode: 400,
        },
      });
    }

    await this.authService.logout(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });

  /**
   * POST /api/auth/logout-all - Logout from all devices
   */
  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    await this.authService.logoutAll(userId);

    return res.status(200).json({
      success: true,
      message: "Logged out from all devices",
    });
  });

  /**
   * GET /api/auth/me - Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await this.authService.getProfile(userId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  });
}

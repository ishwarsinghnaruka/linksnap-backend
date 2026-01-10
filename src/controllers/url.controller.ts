import { Request, Response, NextFunction } from "express";
import { URLService } from "../services/url.service";
import { CreateURLDTO } from "../models/url.model";
import { asyncHandler, AppError } from "../middlewares/error.middleware";
import { DeviceDetector } from "../utils/deviceDetector";

export class URLController {
  private urlService: URLService;

  constructor() {
    this.urlService = new URLService();
  }

  /**
   * POST /api/urls - Create shortened URL
   * Now supports optional authentication
   */
  createShortURL = asyncHandler(async (req: Request, res: Response) => {
    const { originalUrl, customAlias, expiresAt }: CreateURLDTO = req.body;

    // Get user ID if authenticated
    const userId = req.user?.userId;

    // Validate required fields
    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        error: {
          message: "originalUrl is required",
          statusCode: 400,
        },
      });
    }

    // Parse expiresAt if provided
    let parsedExpiresAt: Date | undefined;
    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt);
      if (isNaN(parsedExpiresAt.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Invalid expiresAt date format",
            statusCode: 400,
          },
        });
      }
    }

    const data: CreateURLDTO = {
      originalUrl,
      customAlias,
      expiresAt: parsedExpiresAt,
    };

    const result = await this.urlService.createShortURL(data, userId);

    return res.status(201).json({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/urls - Get all URLs for logged-in user
   */
  getUserURLs = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const urls = await this.urlService.getUserURLs(userId);

    return res.status(200).json({
      success: true,
      data: urls,
    });
  });

  /**
   * GET /:shortCode - Redirect to original URL
   */
  redirectToOriginalURL = asyncHandler(async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    // Extract click data from request
    const forwardedFor = req.headers["x-forwarded-for"];
    const ipAddress =
      (Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor?.split(",")[0]) ||
      req.socket.remoteAddress ||
      "unknown";

    const userAgent = req.headers["user-agent"] || "unknown";

    // Handle referrer (can be string or string[])
    const referrerHeader = req.headers["referer"] || req.headers["referrer"];
    const referrer = Array.isArray(referrerHeader)
      ? referrerHeader[0]
      : referrerHeader;

    const deviceType = DeviceDetector.detect(userAgent);

    // Get original URL and record click
    const originalUrl = await this.urlService.getOriginalURL(shortCode, {
      ipAddress,
      userAgent,
      referrer: referrer || undefined,
      deviceType,
      country: undefined,
      city: undefined,
    });

    // Redirect to original URL
    return res.redirect(302, originalUrl);
  });

  /**
   * GET /api/urls/:shortCode - Get URL details
   */
  getURLDetails = asyncHandler(async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    const originalUrl = await this.urlService.getOriginalURL(shortCode);

    return res.status(200).json({
      success: true,
      data: {
        shortCode,
        originalUrl,
      },
    });
  });

  /**
   * GET /api/urls/:shortCode/analytics - Get analytics
   */
  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    const analytics = await this.urlService.getAnalytics(shortCode);

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  });

  /**
   * DELETE /api/urls/:shortCode - Delete URL
   * Now checks ownership
   */
  deleteURL = asyncHandler(async (req: Request, res: Response) => {
    const { shortCode } = req.params;
    const userId = req.user!.userId;

    await this.urlService.deleteURL(shortCode, userId);

    return res.status(200).json({
      success: true,
      message: "Short URL deleted successfully",
    });
  });
}

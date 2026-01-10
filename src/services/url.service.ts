import { URLRepository } from "../repositories/url.repository";
import { ClickRepository, ClickData } from "../repositories/click.repository";
import {
  CreateURLDTO,
  URLResponse,
  AnalyticsResponse,
} from "../models/url.model";
import { ShortCodeGenerator } from "../utils/shortCodeGenerator";
import { URLValidator } from "../utils/validator";
import { AppError } from "../middlewares/error.middleware";
import { CacheService } from "./cache.service";

export class URLService {
  private urlRepository: URLRepository;
  private clickRepository: ClickRepository;
  private cacheService: CacheService;

  constructor() {
    this.urlRepository = new URLRepository();
    this.clickRepository = new ClickRepository();
    this.cacheService = new CacheService();
  }

  /**
   * Create a shortened URL
   * Now accepts optional userId
   */
  async createShortURL(
    data: CreateURLDTO,
    userId?: number
  ): Promise<URLResponse> {
    // Validate original URL
    const sanitizedUrl = URLValidator.sanitizeURL(data.originalUrl);

    if (!URLValidator.isValidURL(sanitizedUrl)) {
      throw new AppError("Invalid URL format", 400);
    }

    if (URLValidator.isSuspiciousURL(sanitizedUrl)) {
      throw new AppError("URL contains suspicious content", 400);
    }

    // Validate custom alias if provided
    if (data.customAlias) {
      if (!URLValidator.isValidAlias(data.customAlias)) {
        throw new AppError(
          "Invalid custom alias format. Use only alphanumeric, hyphens, and underscores (3-50 characters)",
          400
        );
      }

      // Check if custom alias already exists
      const aliasExists = await this.urlRepository.existsByCustomAlias(
        data.customAlias
      );
      if (aliasExists) {
        throw new AppError("Custom alias already exists", 409);
      }
    }

    // Generate unique short code
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      shortCode = data.customAlias || ShortCodeGenerator.generateRandom(7);
      const exists = await this.urlRepository.existsByShortCode(shortCode);

      if (!exists) break;

      attempts++;
      if (attempts >= maxAttempts) {
        throw new AppError(
          "Failed to generate unique short code. Please try again.",
          500
        );
      }
    } while (attempts < maxAttempts);

    // Create URL in database with userId
    const url = await this.urlRepository.create(
      { ...data, originalUrl: sanitizedUrl },
      shortCode,
      userId // Pass userId to repository
    );

    // Cache the URL
    const cacheKey = `url:${shortCode}`;
    await this.cacheService.set(cacheKey, url.original_url);

    // Build response
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";

    return {
      shortCode: url.short_code,
      shortUrl: `${baseUrl}/${url.short_code}`,
      originalUrl: url.original_url,
      createdAt: url.created_at,
      expiresAt: url.expires_at,
    };
  }

  /**
   * Get all URLs for a user
   */
  async getUserURLs(userId: number): Promise<URLResponse[]> {
    const urls = await this.urlRepository.findByUserId(userId);

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";

    return urls.map((url) => ({
      shortCode: url.short_code,
      shortUrl: `${baseUrl}/${url.short_code}`,
      originalUrl: url.original_url,
      createdAt: url.created_at,
      expiresAt: url.expires_at,
    }));
  }

  /**
   * Get original URL by short code and record click
   */
  async getOriginalURL(
    shortCode: string,
    clickData?: Partial<ClickData>
  ): Promise<string> {
    // Validate short code format
    if (!ShortCodeGenerator.isValid(shortCode)) {
      throw new AppError("Invalid short code format", 400);
    }

    const cacheKey = `url:${shortCode}`;

    // Try to get from cache first (FAST PATH)
    let originalUrl = await this.cacheService.get(cacheKey);

    if (originalUrl) {
      console.log(`✅ Cache HIT for ${shortCode}`);

      // Record click asynchronously (don't wait)
      if (clickData) {
        this.recordClickAsync(shortCode, clickData);
      }

      return originalUrl;
    }

    // Cache MISS - get from database (SLOW PATH)
    console.log(`⚠️  Cache MISS for ${shortCode}`);

    const url = await this.urlRepository.findByShortCode(shortCode);

    if (!url) {
      throw new AppError("Short URL not found", 404);
    }

    // Check if expired
    const isExpired = await this.urlRepository.isExpired(url);
    if (isExpired) {
      throw new AppError("This short URL has expired", 410);
    }

    // Cache the URL for next time
    await this.cacheService.set(cacheKey, url.original_url);

    // Record click
    if (clickData) {
      this.clickRepository
        .create({
          urlId: url.id,
          ...clickData,
        })
        .catch((err) => {
          console.error("Failed to record click:", err);
        });
    }

    return url.original_url;
  }

  /**
   * Record click asynchronously (for cached URLs)
   */
  private async recordClickAsync(
    shortCode: string,
    clickData: Partial<ClickData>
  ) {
    try {
      const url = await this.urlRepository.findByShortCode(shortCode);
      if (url) {
        await this.clickRepository.create({
          urlId: url.id,
          ...clickData,
        });
      }
    } catch (err) {
      console.error("Failed to record click async:", err);
    }
  }

  /**
   * Get analytics for a short URL
   */
  async getAnalytics(shortCode: string): Promise<AnalyticsResponse> {
    // Validate short code
    if (!ShortCodeGenerator.isValid(shortCode)) {
      throw new AppError("Invalid short code format", 400);
    }

    // Find URL
    const url = await this.urlRepository.findByShortCode(shortCode);

    if (!url) {
      throw new AppError("Short URL not found", 404);
    }

    // Get analytics data in parallel
    const [totalClicks, clicksByDate, clicksByCountry, clicksByDevice] =
      await Promise.all([
        this.clickRepository.getTotalClicks(url.id),
        this.clickRepository.getClicksByDate(url.id, 30),
        this.clickRepository.getClicksByCountry(url.id),
        this.clickRepository.getClicksByDevice(url.id),
      ]);

    return {
      shortCode: url.short_code,
      totalClicks,
      clicksByDate,
      clicksByCountry,
      clicksByDevice,
    };
  }

  /**
   * Delete a short URL
   * Now checks ownership
   */
  async deleteURL(shortCode: string, userId: number): Promise<void> {
    // Check ownership
    const url = await this.urlRepository.findByShortCode(shortCode);

    if (!url) {
      throw new AppError("Short URL not found", 404);
    }

    if (url.user_id !== userId) {
      throw new AppError("You do not have permission to delete this URL", 403);
    }

    const deleted = await this.urlRepository.deleteByShortCode(shortCode);

    if (!deleted) {
      throw new AppError("Failed to delete URL", 500);
    }

    // Remove from cache
    const cacheKey = `url:${shortCode}`;
    await this.cacheService.delete(cacheKey);
  }
}

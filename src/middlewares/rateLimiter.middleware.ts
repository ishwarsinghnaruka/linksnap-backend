import rateLimit from "express-rate-limit";

/**
 * Rate limiter for URL creation
 * Limits: 10 URLs per 15 minutes per IP
 */
export const createURLLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: {
      message:
        "Too many URLs created from this IP, please try again after 15 minutes",
      statusCode: 429,
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Rate limiter for general API requests
 * Limits: 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: "Too many requests from this IP, please try again later",
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for redirects
 * More lenient: 200 redirects per 15 minutes per IP
 */
export const redirectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    error: {
      message: "Too many redirects from this IP, please try again later",
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
});

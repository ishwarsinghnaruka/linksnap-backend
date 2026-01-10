import { Router } from "express";
import { URLController } from "../controllers/url.controller";
import {
  createURLLimiter,
  generalLimiter,
} from "../middlewares/rateLimiter.middleware";
import {
  optionalAuth,
  authenticateToken,
} from "../middlewares/auth.middleware";

const router = Router();
const urlController = new URLController();

/**
 * @route   POST /api/urls
 * @desc    Create shortened URL
 * @access  Public/Private (optional auth - if logged in, URL is linked to user)
 */
router.post("/", createURLLimiter, optionalAuth, urlController.createShortURL);

/**
 * @route   GET /api/urls
 * @desc    Get all URLs for logged-in user
 * @access  Private
 */
router.get("/", authenticateToken, urlController.getUserURLs);

/**
 * @route   GET /api/urls/:shortCode
 * @desc    Get URL details (without redirect)
 * @access  Public
 */
router.get("/:shortCode", generalLimiter, urlController.getURLDetails);

/**
 * @route   GET /api/urls/:shortCode/analytics
 * @desc    Get analytics for a short URL
 * @access  Public
 */
router.get("/:shortCode/analytics", generalLimiter, urlController.getAnalytics);

/**
 * @route   DELETE /api/urls/:shortCode
 * @desc    Delete a short URL
 * @access  Private (only owner can delete)
 */
router.delete("/:shortCode", authenticateToken, urlController.deleteURL);

export default router;

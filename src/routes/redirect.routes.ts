import { Router } from "express";
import { URLController } from "../controllers/url.controller";
import { redirectLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();
const urlController = new URLController();

/**
 * @route   GET /:shortCode
 * @desc    Redirect to original URL
 * @access  Public (rate limited)
 */
router.get("/:shortCode", redirectLimiter, urlController.redirectToOriginalURL);

export default router;

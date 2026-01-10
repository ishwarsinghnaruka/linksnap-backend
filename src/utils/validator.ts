/**
 * URL validation utilities
 */

export class URLValidator {
  /**
   * Validate URL format
   * @param url - URL to validate
   * @returns true if valid HTTP/HTTPS URL
   */
  static isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * Validate custom alias format
   * @param alias - Custom alias to validate
   * @returns true if valid (alphanumeric, hyphens, underscores only)
   */
  static isValidAlias(alias: string): boolean {
    if (!alias || alias.length < 3 || alias.length > 50) {
      return false;
    }
    // Only allow alphanumeric, hyphens, and underscores
    return /^[a-zA-Z0-9_-]+$/.test(alias);
  }

  /**
   * Sanitize URL (trim whitespace, remove trailing slashes)
   * @param url - URL to sanitize
   * @returns Sanitized URL
   */
  static sanitizeURL(url: string): string {
    return url.trim().replace(/\/+$/, "");
  }

  /**
   * Check if URL is potentially malicious
   * Basic blacklist check
   * @param url - URL to check
   * @returns true if suspicious
   */
  static isSuspiciousURL(url: string): boolean {
    const suspiciousPatterns = [
      "javascript:",
      "data:",
      "vbscript:",
      "file:",
      "about:",
    ];

    const lowerUrl = url.toLowerCase();
    return suspiciousPatterns.some((pattern) => lowerUrl.includes(pattern));
  }
}

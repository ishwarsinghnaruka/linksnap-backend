/**
 * Detect device type from User-Agent string
 */
export class DeviceDetector {
  static detect(userAgent: string | undefined): string {
    if (!userAgent) return "unknown";

    const ua = userAgent.toLowerCase();

    // Check for tablet first (as some tablets also match mobile patterns)
    if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
      return "tablet";
    }

    // Check for mobile
    if (
      /mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)
    ) {
      return "mobile";
    }

    // Default to desktop
    return "desktop";
  }
}

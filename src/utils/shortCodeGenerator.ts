// Generate a random short code using Base62 encoding
const BASE62_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export class ShortCodeGenerator {
  /*
    Generate random short code
    @param length- Length of short code(default: 7)
    @returns Random short code
    */

  static generateRandom(length: number = 7): string {
    let shortCode = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * BASE62_CHARS.length);
      shortCode += BASE62_CHARS[randomIndex];
    }
    return shortCode;
  }

  /**
   * Generate short code from number---for sequential IDs
   * @param num - Number to encode
   * @returns Base62 encoded string
   */

  static encodeNumber(num: number): string {
    if (num === 0) return BASE62_CHARS[0];

    let encoded = "";
    while (num > 0) {
      encoded = BASE62_CHARS[num % 62] + encoded;
      num = Math.floor(num / 62);
    }
    return encoded;
  }
  /**
   * Decode Base62 string back to number
   * @param str - Base62 encoded string
   * @returns Original number
   */
  static decodeToNumber(str: string): number {
    let num = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const charIndex = BASE62_CHARS.indexOf(char);
      if (charIndex === -1) {
        throw new Error(`Invalid character in short code: ${char}`);
      }
      num = num * 62 + charIndex;
    }
    return num;
  }

  /**
   * Validate short code format
   * @param shortCode - Short code to validate
   * @returns true if valid
   */
  static isValid(shortCode: string): boolean {
    if (!shortCode || shortCode.length < 6 || shortCode.length > 10) {
      return false;
    }
    return /^[a-zA-Z0-9]+$/.test(shortCode);
  }
}

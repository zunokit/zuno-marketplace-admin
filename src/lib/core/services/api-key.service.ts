import { randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";

export interface GeneratedApiKey {
  key: string;
  keyHash: string;
  keyPrefix: string;
}

export class ApiKeyService {
  private readonly PREFIX = "zuno";
  private readonly KEY_LENGTH = 32;
  private readonly SALT_ROUNDS = 10;

  /**
   * Generate a secure API key with hash and prefix
   * Format: zuno_<random_32_chars>
   */
  async generateApiKey(): Promise<GeneratedApiKey> {
    // Generate random bytes
    const randomString = randomBytes(this.KEY_LENGTH)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, this.KEY_LENGTH);

    // Create the full key
    const key = `${this.PREFIX}_${randomString}`;

    // Extract prefix (first 8 characters for display)
    const keyPrefix = key.substring(0, 12); // "zuno_xxxxx"

    // Hash the key for storage (NEVER store plaintext)
    const keyHash = await hash(key, this.SALT_ROUNDS);

    return {
      key, // Return this ONCE to the user (never store)
      keyHash, // Store this in database
      keyPrefix, // Store this for display (e.g., "zuno_xxxxx...")
    };
  }

  /**
   * Verify an API key against its hash
   */
  async verifyApiKey(plainKey: string, keyHash: string): Promise<boolean> {
    try {
      return await compare(plainKey, keyHash);
    } catch {
      return false;
    }
  }

  /**
   * Check if an API key has expired
   */
  isExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    return new Date() > expiresAt;
  }

  /**
   * Generate a masked key for display
   * Example: zuno_abc***xyz
   */
  maskKey(keyPrefix: string): string {
    return `${keyPrefix}${"*".repeat(20)}`;
  }
}

/**
 * Invitation Token Utilities
 * Generate and validate secure invitation tokens
 */

import { randomBytes, createHash } from "crypto";
import { getUrl } from "./production";

/**
 * Generate a secure invitation token
 * Returns a URL-safe token string
 */
export function generateInvitationToken(): string {
  // Generate 32 random bytes (256 bits)
  const token = randomBytes(32).toString("base64url");
  return token;
}

/**
 * Hash an invitation token for secure storage
 * Store the hash in database, not the plain token
 */
export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Verify if a token matches its hash
 */
export function verifyInvitationToken(token: string, hash: string): boolean {
  const tokenHash = hashInvitationToken(token);
  return tokenHash === hash;
}

/**
 * Generate invitation URL with token
 */
export function generateInvitationUrl(
  invitationId: string,
  token: string
): string {
  const baseUrl = getUrl();
  return `${baseUrl}/invite/accept?id=${invitationId}&token=${token}`;
}

/**
 * Check if invitation has expired
 */
export function isInvitationExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Calculate expiration date from now
 */
export function calculateExpirationDate(days: number): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

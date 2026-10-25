import crypto from "crypto";

/**
 * Computes a normalized SHA-256 hash of a Facebook event description.
 * Normalizes CRLF to LF and trims outer whitespace so hashing is consistent.
 */
export function computeDescriptionHash(description?: string | null): string {
  if (!description) return "";
  const normalized = description.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";
  return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
}

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

let warnedAboutFallbackKey = false;

function getEncryptionKey(): Buffer {
  let secret = process.env.GOOGLE_ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "GOOGLE_ENCRYPTION_KEY environment variable is required in production (AES-256-GCM key used to encrypt OAuth refresh tokens at rest)."
      );
    }
    // Development/test fallback only — never rely on it in production.
    secret = process.env.NEXTAUTH_SECRET || "dev_only_insecure_encryption_key_0123456789abcdef";
    if (!warnedAboutFallbackKey) {
      console.warn("[encryption] GOOGLE_ENCRYPTION_KEY is not set — using an insecure fallback key. Set it in production.");
      warnedAboutFallbackKey = true;
    }
  }
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt plaintext string using AES-256-GCM
 */
export function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt ciphertext string using AES-256-GCM
 */
export function decrypt(cipherText: string): string {
  if (!cipherText) return "";
  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    return cipherText;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

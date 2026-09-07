import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "@/lib/encryption";

describe("Encryption Utilities", () => {
  it("should encrypt and decrypt string reliably with AES-256-GCM", () => {
    const rawSecret = "1//04_example_refresh_token_very_sensitive_key";
    const cipherText = encrypt(rawSecret);

    expect(cipherText).not.toBe(rawSecret);
    expect(cipherText).toContain(":");

    const decrypted = decrypt(cipherText);
    expect(decrypted).toBe(rawSecret);
  });

  it("should handle empty or null safely", () => {
    expect(encrypt("")).toBe("");
    expect(decrypt("")).toBe("");
  });
});

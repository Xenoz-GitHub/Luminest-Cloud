import { describe, expect, it } from "vitest";
import {
  buildShareUrl,
  createShareAccessValue,
  createShareToken,
  hashSharePassword,
  hashShareToken,
  parseShareToken,
  shareAccessCookieName,
  verifyShareAccessValue,
  verifySharePassword,
  verifyShareToken,
} from "./token";

const SHARE_ID = "123e4567-e89b-42d3-a456-426614174000";

describe("share tokens", () => {
  it("creates a deterministic, parseable token", () => {
    const token = createShareToken(SHARE_ID);
    expect(token.startsWith(`${SHARE_ID}.`)).toBe(true);
    expect(parseShareToken(token)).toBe(SHARE_ID);
    expect(createShareToken(SHARE_ID)).toBe(token);
  });

  it("stores only a hash of the token", () => {
    const token = createShareToken(SHARE_ID);
    const hash = hashShareToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(verifyShareToken(token, hash)).toBe(true);
  });

  it("rejects tampered and malformed tokens", () => {
    const token = createShareToken(SHARE_ID);
    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
    expect(verifyShareToken(tampered, hashShareToken(token))).toBe(false);
    expect(parseShareToken("not-a-share-token")).toBeNull();
    expect(parseShareToken(`${SHARE_ID}.`)).not.toBeNull();
    expect(parseShareToken("not-a-uuid.signature")).toBeNull();
  });

  it("refuses to sign tokens in production without a configured secret", () => {
    const originalSecret = process.env.SHARE_TOKEN_SECRET;
    const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const originalNodeEnv = process.env.NODE_ENV;
    try {
      delete process.env.SHARE_TOKEN_SECRET;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      // NODE_ENV is read-only in some toolchains; assignment is safe here
      // because the value is restored in the finally block.
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      expect(() =>
        createShareToken("11111111-1111-4111-8111-111111111111")
      ).toThrow(/SHARE_TOKEN_SECRET/);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
      if (originalSecret === undefined) delete process.env.SHARE_TOKEN_SECRET;
      else process.env.SHARE_TOKEN_SECRET = originalSecret;
      if (originalServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
    }
  });

  it("issues and verifies password-access cookies", () => {
    const value = createShareAccessValue(SHARE_ID);
    expect(verifyShareAccessValue(SHARE_ID, value)).toBe(true);
    expect(verifyShareAccessValue(SHARE_ID, "wrong")).toBe(false);
    expect(verifyShareAccessValue(SHARE_ID, undefined)).toBe(false);
    expect(shareAccessCookieName(SHARE_ID)).toBe(
      "ln_share_123e4567e89b42d3a456426614174000"
    );
  });

  it("hashes share passwords with a per-share salt", () => {
    const first = hashSharePassword("little-nest");
    const second = hashSharePassword("little-nest");
    expect(first).not.toBe(second);
    expect(verifySharePassword("little-nest", first)).toBe(true);
    expect(verifySharePassword("wrong-password", first)).toBe(false);
    expect(verifySharePassword("little-nest", null)).toBe(false);
  });

  it("builds the public share URL from the token", () => {
    const token = createShareToken(SHARE_ID);
    const url = buildShareUrl(token);
    expect(url.endsWith(`/s/${token}`)).toBe(true);
    expect(() => new URL(url)).not.toThrow();
  });
});

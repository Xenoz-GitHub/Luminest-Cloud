import { describe, expect, it } from "vitest";
import { MAX_JSON_BYTES, readJson, requestIp } from "./http";

function jsonRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

describe("readJson", () => {
  it("parses a well-formed JSON body", async () => {
    const result = await readJson<{ a: number }>(jsonRequest('{"a":1}'));
    expect(result).toEqual({ a: 1 });
  });

  it("rejects a non-JSON content type", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: '{"a":1}',
    });
    expect(await readJson(request)).toBeNull();
  });

  it("rejects a missing content type", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      body: '{"a":1}',
    });
    expect(await readJson(request)).toBeNull();
  });

  it("rejects a body larger than the byte ceiling", async () => {
    const oversized = `{"a":"${"x".repeat(MAX_JSON_BYTES)}"}`;
    expect(await readJson(jsonRequest(oversized))).toBeNull();
  });

  it("rejects malformed JSON", async () => {
    expect(await readJson(jsonRequest("{not json"))).toBeNull();
  });

  it("honours a custom ceiling for large-but-legitimate payloads", async () => {
    const big = `{"a":"${"x".repeat(MAX_JSON_BYTES)}"}`;
    const result = await readJson<{ a: string }>(jsonRequest(big), MAX_JSON_BYTES * 4);
    expect(result?.a).toHaveLength(MAX_JSON_BYTES);
  });
});

describe("requestIp", () => {
  it("prefers x-real-ip", () => {
    const request = new Request("https://example.test", {
      headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "1.2.3.4" },
    });
    expect(requestIp(request)).toBe("203.0.113.7");
  });

  it("uses the last x-forwarded-for hop so clients cannot spoof it", () => {
    const request = new Request("https://example.test", {
      headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1, 198.51.100.4" },
    });
    expect(requestIp(request)).toBe("198.51.100.4");
  });

  it("falls back to a constant when no address headers exist", () => {
    expect(requestIp(new Request("https://example.test"))).toBe("local");
  });
});

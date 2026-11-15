import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { isSameOriginRequest } from "@/lib/csrf";

describe("same-origin mutation request validation", () => {
  it("accepts a matching Origin and Host", () => {
    const req = new NextRequest("https://clipdrop.example/api/clipboard", {
      method: "PUT",
      headers: {
        host: "clipdrop.example",
        origin: "https://clipdrop.example",
      },
    });

    expect(isSameOriginRequest(req)).toBe(true);
  });

  it("rejects a different scheme even when the host matches", () => {
    const req = new NextRequest("https://clipdrop.example/api/clipboard", {
      method: "PUT",
      headers: {
        host: "clipdrop.example",
        origin: "http://clipdrop.example",
      },
    });

    expect(isSameOriginRequest(req)).toBe(false);
  });

  it("rejects an origin whose host differs from the request host", () => {
    const req = new NextRequest("https://clipdrop.example/api/clipboard", {
      method: "PUT",
      headers: {
        host: "clipdrop.example",
        origin: "https://attacker.example",
      },
    });

    expect(isSameOriginRequest(req)).toBe(false);
  });

  it("rejects a malformed Origin value", () => {
    const req = new NextRequest("https://clipdrop.example/api/clipboard", {
      method: "PUT",
      headers: {
        host: "clipdrop.example",
        origin: "not-a-url",
      },
    });

    expect(isSameOriginRequest(req)).toBe(false);
  });

  it("rejects mutation requests that omit Origin", () => {
    const req = new NextRequest("https://clipdrop.example/api/clipboard", {
      method: "PUT",
      headers: { host: "clipdrop.example" },
    });

    expect(isSameOriginRequest(req)).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  tooManyRequests,
  serverError,
  noContent,
  ok,
} from "@/lib/apiResponses";

async function bodyOf(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

describe("apiResponses", () => {
  it("unauthorized returns 401 with error body", async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    expect(await bodyOf(res)).toEqual({ error: "Unauthorized" });
  });

  it("forbidden returns 403", async () => {
    const res = forbidden();
    expect(res.status).toBe(403);
    expect(await bodyOf(res)).toHaveProperty("error");
  });

  it("notFound returns 404", async () => {
    const res = notFound();
    expect(res.status).toBe(404);
  });

  it("badRequest returns 400 with the given message", async () => {
    const res = badRequest("name is required");
    expect(res.status).toBe(400);
    expect(await bodyOf(res)).toEqual({ error: "name is required" });
  });

  it("tooManyRequests returns 429", async () => {
    const res = tooManyRequests();
    expect(res.status).toBe(429);
  });

  it("serverError returns 500", async () => {
    const res = serverError();
    expect(res.status).toBe(500);
  });

  it("noContent returns 204 with empty body", async () => {
    const res = noContent();
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("ok returns 200 by default with the given payload", async () => {
    const res = ok({ devices: [] });
    expect(res.status).toBe(200);
    expect(await bodyOf(res)).toEqual({ devices: [] });
  });

  it("ok supports a custom status code", async () => {
    const res = ok({ success: true }, 201);
    expect(res.status).toBe(201);
  });

  it("every error response uses the same { error } shape", async () => {
    const responses = [
      unauthorized(),
      forbidden(),
      notFound(),
      badRequest("x"),
      tooManyRequests(),
      serverError(),
    ];
    for (const res of responses) {
      const body = await bodyOf(res);
      expect(Object.keys(body)).toEqual(["error"]);
      expect(typeof body.error).toBe("string");
    }
  });
});

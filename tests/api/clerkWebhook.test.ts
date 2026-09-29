import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockVerify = vi.fn();
vi.mock("svix", () => ({
  Webhook: class {
    verify = mockVerify;
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(
    new Headers({
      "svix-id": "msg_123",
      "svix-timestamp": "1234567890",
      "svix-signature": "v1,signature123",
    }),
  ),
}));

import { POST } from "@/app/api/webhooks/clerk/route";
import { prisma } from "@/lib/prisma";

function makeReq(body: unknown) {
  return new NextRequest("http://localhost/api/webhooks/clerk", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("Clerk Webhook (app/api/webhooks/clerk/route)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_WEBHOOK_SECRET = "whsec_test123";
  });

  it("returns 400 on invalid signature", async () => {
    mockVerify.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid signature");
  });

  it("upserts user on user.created", async () => {
    mockVerify.mockReturnValue({
      type: "user.created",
      data: {
        id: "user_new",
        email_addresses: [{ email_address: "test@example.com" }],
      },
    });

    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { id: "user_new" },
      update: { email: "test@example.com" },
      create: { id: "user_new", email: "test@example.com" },
    });
  });

  it("deletes user on user.deleted successfully", async () => {
    mockVerify.mockReturnValue({
      type: "user.deleted",
      data: {
        id: "user_del_1",
      },
    });

    (prisma.user.delete as any).mockResolvedValue({ id: "user_del_1" });

    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: "user_del_1" },
    });
  });

  it("handles user.deleted idempotently when user already does not exist (P2025)", async () => {
    mockVerify.mockReturnValue({
      type: "user.deleted",
      data: {
        id: "user_not_found",
      },
    });

    const p2025Err = new Error("Record to delete does not exist.");
    (p2025Err as any).code = "P2025";
    (prisma.user.delete as any).mockRejectedValue(p2025Err);

    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it("returns 500 on unexpected database error during user.deleted", async () => {
    mockVerify.mockReturnValue({
      type: "user.deleted",
      data: {
        id: "user_error",
      },
    });

    const dbErr = new Error("Database connection lost");
    (prisma.user.delete as any).mockRejectedValue(dbErr);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(makeReq({}));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to delete user");

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to delete user in Clerk webhook:",
      dbErr,
    );
    consoleSpy.mockRestore();
  });
});

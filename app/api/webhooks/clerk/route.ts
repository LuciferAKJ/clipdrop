import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ClerkWebhookEvent = {
  type: string;
  data: {
    id?: string;
    email_addresses?: Array<{
      email_address: string;
    }>;
  };
};

export async function POST(req: NextRequest) {
  const payload = await req.text();

  const headerList = await headers();

  const svixHeaders = {
    "svix-id": headerList.get("svix-id")!,
    "svix-timestamp": headerList.get("svix-timestamp")!,
    "svix-signature": headerList.get("svix-signature")!,
  };

  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let event: ClerkWebhookEvent;

  try {
    event = webhook.verify(payload, svixHeaders) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses } = event.data;

      await prisma.user.upsert({
        where: { id: id! },
        update: {
          email: email_addresses?.[0]?.email_address ?? "",
        },
        create: {
          id: id!,
          email: email_addresses?.[0]?.email_address ?? "",
        },
      });

      break;
    }

    case "user.deleted": {
      if (event.data.id) {
        await prisma.user
          .delete({
            where: {
              id: event.data.id,
            },
          })
          .catch(() => {});
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}

import { prisma } from "./prisma";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function generateUniqueCode(length = 6): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = Array.from({ length }, () =>
      ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    ).join("");

    const exists = await prisma.share.findUnique({
      where: { code },
    });

    if (!exists) return code;
  }

  throw new Error("Failed to generate unique code");
}
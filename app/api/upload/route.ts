import{NextRequest, NextResponse} from "next/server";

import{prisma} from "@/lib/prisma";

import{generateUniqueCode} from "@/lib/codeGen";

import{validateTextShare, validateFile} from "@/lib/validation";

import{uploadToCloudinary} from "@/lib/cloudinary";

import{hashPassword} from "@/lib/password";
import{auth} from "@clerk/nextjs/server";
import{getClientIp, hashIp} from "@/lib/ipHash";
import{checkRateLimit, RateLimitError} from "@/lib/rateLimit";

const EXPIRY_MS = 60 * 60 * 1000;

export async function POST(req : NextRequest) {

    try {
        const {userId} = await auth();

        const ipHash = hashIp(getClientIp(req));

        try {
            await checkRateLimit(ipHash);
        } catch (error) {
            if (error instanceof RateLimitError) {
                return NextResponse.json({error : error.message},
                                         {status : 429});
            }

            throw error;
        }

        const type = req.headers.get("content-type") || "";

        const code = await generateUniqueCode();

        const expiresAt = new Date(Date.now() + EXPIRY_MS);

        // =========================
        // FILE UPLOAD
        // =========================

        if (type.includes("multipart/form-data")) {

            const formData = await req.formData();

            const files = formData.getAll("files") as File[];

            console.log("FILES RECEIVED:",
                        files.map(file => ({
                                             name : file.name,
                                             type : file.type,
                                             size : file.size
                                         })));

            const text = formData.get("text") as string | null;

            const password = formData.get("password") as string | null;

            const oneTimeUse = formData.get("oneTimeUse") === "true";

            const passwordHash = password ? await hashPassword(password) : null;

            if (!files.length && !text) {
                throw new Error("Nothing uploaded");
            }

            if (text) {
                validateTextShare(text);
            }

      const share =
  await prisma.share.create({
    data: {
      code,
      textContent: text,
      expiresAt,
      passwordHash,
      oneTimeUse,
      userId: userId ?? null,
      ipHash,
    },
  });

      for (const file of files) {

          validateFile(file);

          const buffer = Buffer.from(await file.arrayBuffer());

          const uploaded = await uploadToCloudinary(buffer, file.name);

          await prisma.file.create({

              data : {

                  shareId : share.id,

                  url : uploaded.url,

                  publicId : uploaded.publicId,

                  mimeType : file.type,

                  sizeBytes : file.size,

                  originalName : file.name

              }

          });
      }

      return NextResponse.json({code : share.code}, {status : 201});
        }

        // =========================
        // TEXT ONLY JSON UPLOAD
        // =========================

        const body = await req.json();

        const {text, password, oneTimeUse} = body;

        validateTextShare(text);

        const passwordHash = password ? await hashPassword(password) : null;

        const share =
  await prisma.share.create({
    data: {
      code,
      textContent: text,
      expiresAt,
      passwordHash,
      oneTimeUse: !!oneTimeUse,
      userId: userId ?? null,
      ipHash,
    },
  });

        return NextResponse.json({code : share.code}, {status : 201});

    }

    catch (error) {

        console.error("========== UPLOAD ERROR ==========");

        console.error(error);

        console.error("===================================");

        return NextResponse.json(

            {error : error instanceof Error ? error.message : "Upload failed"},

            {status : 500}

        );
    }
}
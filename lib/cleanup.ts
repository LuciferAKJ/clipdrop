import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";


export async function cleanupExpiredShares() {

  const expiredShares = await prisma.share.findMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    },
    include: {
      files: true
    }
  });

for (const share of expiredShares) {

  // Delete files from Cloudinary
  for (const file of share.files) {
    await deleteFromCloudinary(file.publicId);
  }

  // Delete File rows from PostgreSQL
  await prisma.file.deleteMany({
    where: {
      shareId: share.id,
    },
  });

  // Now delete the Share row
  await prisma.share.delete({
    where: {
      id: share.id,
    },
  });
}
}
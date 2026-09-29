-- DropForeignKey
ALTER TABLE "ClipboardSync" DROP CONSTRAINT "ClipboardSync_userId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_userId_fkey";

-- CreateIndex
CREATE INDEX "File_shareId_idx" ON "File"("shareId");

-- CreateIndex
CREATE INDEX "Share_userId_createdAt_idx" ON "Share"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Share_ipHash_createdAt_idx" ON "Share"("ipHash", "createdAt");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipboardSync" ADD CONSTRAINT "ClipboardSync_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

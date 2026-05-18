ALTER TABLE "StorageFile"
ADD COLUMN "orphanedAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "StorageFile_orphanedAt_idx" ON "StorageFile"("orphanedAt");
CREATE INDEX "StorageFile_deletedAt_idx" ON "StorageFile"("deletedAt");

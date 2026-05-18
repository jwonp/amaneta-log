/*
  Warnings:

  - You are about to drop the column `publicUrl` on the `StorageFile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "StorageFile_publicUrl_key";

-- AlterTable
ALTER TABLE "StorageFile" DROP COLUMN "publicUrl";

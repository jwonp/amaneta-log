/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[username,provider]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "StorageFileStatus" AS ENUM ('TEMP', 'ATTACHED', 'ORPHANED', 'DELETED');

-- CreateEnum
CREATE TYPE "StorageFileUsage" AS ENUM ('CONTENT', 'THUMBNAIL');

-- CreateEnum
CREATE TYPE "StorageFileKind" AS ENUM ('IMAGE', 'VIDEO', 'OTHER');

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "email" SET DEFAULT '',
ALTER COLUMN "provider" SET DEFAULT 'CREDENTIALS',
ALTER COLUMN "role" SET DEFAULT 'USER',
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserAuth" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "markdown" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageFile" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "usage" "StorageFileUsage" NOT NULL DEFAULT 'CONTENT',
    "kind" "StorageFileKind" NOT NULL,
    "status" "StorageFileStatus" NOT NULL DEFAULT 'TEMP',
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attachedAt" TIMESTAMP(3),

    CONSTRAINT "StorageFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

-- CreateIndex
CREATE INDEX "Post_status_idx" ON "Post"("status");

-- CreateIndex
CREATE INDEX "Post_isPublic_idx" ON "Post"("isPublic");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_publishedAt_idx" ON "Post"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StorageFile_publicUrl_key" ON "StorageFile"("publicUrl");

-- CreateIndex
CREATE INDEX "StorageFile_postId_idx" ON "StorageFile"("postId");

-- CreateIndex
CREATE INDEX "StorageFile_status_idx" ON "StorageFile"("status");

-- CreateIndex
CREATE INDEX "StorageFile_usage_idx" ON "StorageFile"("usage");

-- CreateIndex
CREATE INDEX "StorageFile_kind_idx" ON "StorageFile"("kind");

-- CreateIndex
CREATE INDEX "StorageFile_createdAt_idx" ON "StorageFile"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StorageFile_postId_storedName_key" ON "StorageFile"("postId", "storedName");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_provider_key" ON "User"("username", "provider");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageFile" ADD CONSTRAINT "StorageFile_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

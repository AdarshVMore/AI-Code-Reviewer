-- AlterTable
ALTER TABLE "Repository" ADD COLUMN "lastIndexedSha" TEXT;
ALTER TABLE "Repository" ADD COLUMN "lastIndexedAt" TIMESTAMP(3);

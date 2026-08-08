-- AlterTable
ALTER TABLE "UserApiKey" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'anthropic';
ALTER TABLE "UserApiKey" ADD COLUMN "model" TEXT;

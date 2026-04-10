/*
  Warnings:

  - Added the required column `author` to the `PRReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commitSHA` to the `PRReview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PRReview" ADD COLUMN     "author" TEXT NOT NULL,
ADD COLUMN     "commitSHA" TEXT NOT NULL;

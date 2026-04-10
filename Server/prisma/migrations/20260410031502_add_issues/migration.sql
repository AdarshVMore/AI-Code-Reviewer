/*
  Warnings:

  - You are about to drop the column `rawReview` on the `PRReview` table. All the data in the column will be lost.
  - Added the required column `score` to the `PRReview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PRReview" DROP COLUMN "rawReview",
ADD COLUMN     "score" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "fix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "PRReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

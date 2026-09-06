/*
  Warnings:

  - You are about to drop the column `proofImage` on the `outage_reports` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "outage_reports" DROP COLUMN "proofImage",
ADD COLUMN     "notes" TEXT;

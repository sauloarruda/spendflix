/*
  Warnings:

  - You are about to drop the column `userId` on the `category_rules` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[keyword,accountId,categoryId]` on the table `category_rules` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "category_rules" DROP CONSTRAINT "category_rules_userId_fkey";

-- DropIndex
DROP INDEX "category_rules_keyword_userId_categoryId_key";

-- DropIndex
DROP INDEX "category_rules_keyword_userId_idx";

-- DropIndex
DROP INDEX "category_rules_userId_idx";

-- AlterTable
ALTER TABLE "category_rules" DROP COLUMN "userId",
ADD COLUMN     "accountId" TEXT;

-- CreateIndex
CREATE INDEX "category_rules_accountId_idx" ON "category_rules"("accountId");

-- CreateIndex
CREATE INDEX "category_rules_keyword_accountId_idx" ON "category_rules"("keyword", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "category_rules_keyword_accountId_categoryId_key" ON "category_rules"("keyword", "accountId", "categoryId");

-- AddForeignKey
ALTER TABLE "category_rules" ADD CONSTRAINT "category_rules_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

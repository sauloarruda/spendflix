/*
  Warnings:

  - A unique constraint covering the columns `[keyword,userId,categoryId]` on the table `category_rules` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "category_rules_keyword_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "category_rules_keyword_userId_categoryId_key" ON "category_rules"("keyword", "userId", "categoryId");

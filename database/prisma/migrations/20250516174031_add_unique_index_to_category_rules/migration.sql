/*
  Warnings:

  - A unique constraint covering the columns `[keyword,userId]` on the table `category_rules` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "category_rules_keyword_userId_key" ON "category_rules"("keyword", "userId");

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "categoryRuleId" TEXT;

-- CreateIndex
CREATE INDEX "transactions_categoryRuleId_idx" ON "transactions"("categoryRuleId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryRuleId_fkey" FOREIGN KEY ("categoryRuleId") REFERENCES "category_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

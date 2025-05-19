-- CreateIndex
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "category_rules_keyword_idx" ON "category_rules" USING GIN ("keyword" gin_trgm_ops);


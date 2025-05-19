-- AlterTable
ALTER TABLE "category_rules" ADD COLUMN     "ocurrences" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "priority" SET DEFAULT 1;

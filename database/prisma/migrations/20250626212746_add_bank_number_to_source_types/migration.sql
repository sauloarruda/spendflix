/*
  Warnings:

  - Added the required column `bankNumber` to the `source_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "source_types" ADD COLUMN     "bankNumber" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "source_types" ADD CONSTRAINT "source_types_bankNumber_fkey" FOREIGN KEY ("bankNumber") REFERENCES "banks"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

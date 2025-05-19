/*
  Warnings:

  - A unique constraint covering the columns `[checksum]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `checksum` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "checksum" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_checksum_key" ON "transactions"("checksum");

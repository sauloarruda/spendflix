/*
  Warnings:

  - You are about to drop the column `sourceType` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `sources` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "sourceType",
ADD COLUMN     "sourceTypeId" TEXT;

-- AlterTable
ALTER TABLE "sources" DROP COLUMN "type",
ADD COLUMN     "sourceTypeId" TEXT;

-- DropEnum
DROP TYPE "SourceType";

-- CreateTable
CREATE TABLE "source_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "source_types" ADD CONSTRAINT "source_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_sourceTypeId_fkey" FOREIGN KEY ("sourceTypeId") REFERENCES "source_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_sourceTypeId_fkey" FOREIGN KEY ("sourceTypeId") REFERENCES "source_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

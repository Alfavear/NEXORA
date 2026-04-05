/*
  Warnings:

  - You are about to drop the column `taxId` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `Purchase` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_taxId_fkey";

-- DropIndex
DROP INDEX "Item_taxId_idx";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "taxId";

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "tax";

-- CreateTable
CREATE TABLE "SaleTax" (
    "saleId" INTEGER NOT NULL,
    "taxId" INTEGER NOT NULL,

    CONSTRAINT "SaleTax_pkey" PRIMARY KEY ("saleId","taxId")
);

-- AddForeignKey
ALTER TABLE "SaleTax" ADD CONSTRAINT "SaleTax_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleTax" ADD CONSTRAINT "SaleTax_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

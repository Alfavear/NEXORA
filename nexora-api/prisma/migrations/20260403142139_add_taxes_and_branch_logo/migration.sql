-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "taxId" INTEGER;

-- CreateTable
CREATE TABLE "Tax" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tax_companyId_idx" ON "Tax"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Tax_companyId_name_key" ON "Tax"("companyId", "name");

-- CreateIndex
CREATE INDEX "Item_taxId_idx" ON "Item"("taxId");

-- AddForeignKey
ALTER TABLE "Tax" ADD CONSTRAINT "Tax_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE SET NULL ON UPDATE CASCADE;

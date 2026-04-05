-- CreateTable
CREATE TABLE "SaleInstallment" (
    "id" SERIAL NOT NULL,
    "saleId" INTEGER NOT NULL,
    "quotaNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaleInstallment_saleId_idx" ON "SaleInstallment"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleInstallment_saleId_quotaNumber_key" ON "SaleInstallment"("saleId", "quotaNumber");

-- AddForeignKey
ALTER TABLE "SaleInstallment" ADD CONSTRAINT "SaleInstallment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

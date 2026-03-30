import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async createSale(userId: number, dto: any) {
    const companyId = 1; // TODO: resolve from user

    const sale = await this.prisma.sale.create({
      data: {
        companyId,
        branchId: dto.branchId,
        sellerId: userId,
        systemNumber: `VTA-${Date.now()}`,
        externalReceiptNumber: dto.externalReceiptNumber,
        total: 0,
      },
    });

    let total = 0;

    for (const item of dto.items) {
      const stock = await this.prisma.branchStock.findFirst({
        where: { itemId: item.itemId, branchId: dto.branchId },
      });

      if (!stock || Number(stock.quantity) < item.quantity) {
        throw new Error('Stock insuficiente');
      }

      const newQty = Number(stock.quantity) - item.quantity;

      await this.prisma.branchStock.update({
        where: { id: stock.id },
        data: { quantity: newQty },
      });

      await this.prisma.inventoryMovement.create({
        data: {
          companyId,
          branchId: dto.branchId,
          itemId: item.itemId,
          type: 'SALE',
          quantity: item.quantity,
          balanceAfter: newQty,
          reference: sale.systemNumber,
        },
      });

      total += item.quantity * item.price;

      await this.prisma.saleDetail.create({
        data: {
          saleId: sale.id,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.price,
        },
      });
    }

    return this.prisma.sale.update({
      where: { id: sale.id },
      data: { total },
    });
  }
}

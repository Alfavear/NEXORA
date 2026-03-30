import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async getUserContext(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return { companyId: user.companyId };
  }

  async createSale(userId: number, dto: CreateSaleDto) {
    const { companyId } = await this.getUserContext(userId);

    const sale = await this.prisma.sale.create({
      data: {
        companyId,
        branchId: 1,
        sellerId: userId,
        systemNumber: `VTA-${Date.now()}`,
        externalReceiptNumber: dto.externalReceiptNumber,
      },
    });

    let total = 0;

    for (const item of dto.items) {
      const stock = await this.prisma.branchStock.findFirst({
        where: { itemId: item.itemId, branchId: 1 },
      });

      if (!stock || Number(stock.quantity) < item.quantity) {
        throw new BadRequestException('Stock insuficiente');
      }

      const newQty = Number(stock.quantity) - item.quantity;

      await this.prisma.branchStock.update({
        where: { id: stock.id },
        data: { quantity: newQty },
      });

      await this.prisma.inventoryMovement.create({
        data: {
          companyId,
          branchId: 1,
          itemId: item.itemId,
          type: 'SALE',
          quantity: item.quantity,
          balanceAfter: newQty,
          reference: sale.systemNumber,
        },
      });

      total += item.quantity * item.unitPrice;

      await this.prisma.saleDetail.create({
        data: {
          saleId: sale.id,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        },
      });
    }

    return this.prisma.sale.update({ where: { id: sale.id }, data: { total, subtotal: total } });
  }

  async findAll(userId: number) {
    const { companyId } = await this.getUserContext(userId);
    return this.prisma.sale.findMany({ where: { companyId }, include: { details: true } });
  }

  async findOne(userId: number, id: number) {
    return this.prisma.sale.findUnique({ where: { id }, include: { details: true } });
  }

  async createReturn(userId: number, saleId: number, dto: CreateReturnDto) {
    const { companyId } = await this.getUserContext(userId);

    const sale = await this.prisma.sale.findUnique({ where: { id: saleId } });

    if (!sale) throw new BadRequestException('Venta no encontrada');

    const ret = await this.prisma.saleReturn.create({
      data: {
        companyId,
        branchId: sale.branchId,
        saleId,
        createdById: userId,
        systemNumber: `DEV-${Date.now()}`,
      },
    });

    for (const item of dto.items) {
      const stock = await this.prisma.branchStock.findFirst({
        where: { itemId: item.itemId, branchId: sale.branchId },
      });

      const newQty = Number(stock.quantity) + item.quantity;

      await this.prisma.branchStock.update({ where: { id: stock.id }, data: { quantity: newQty } });

      await this.prisma.inventoryMovement.create({
        data: {
          companyId,
          branchId: sale.branchId,
          itemId: item.itemId,
          type: 'RETURN_SALE',
          quantity: item.quantity,
          balanceAfter: newQty,
          reference: ret.systemNumber,
        },
      });

      await this.prisma.saleReturnDetail.create({
        data: {
          saleReturnId: ret.id,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: 0,
          subtotal: 0,
        },
      });
    }

    return ret;
  }
}

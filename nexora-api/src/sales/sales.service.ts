import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async getUserContext(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuario inválido');
    return { companyId: user.companyId };
  }

  async createSale(userId: number, branchId: number, dto: CreateSaleDto) {
    const { companyId } = await this.getUserContext(userId);

    const sale = await this.prisma.sale.create({
      data: {
        companyId,
        branchId,
        sellerId: userId,
        customerId: dto.customerId,
        notes: dto.notes,
        systemNumber: `VTA-${Date.now()}`,
        externalReceiptNumber: dto.externalReceiptNumber,
      },
    });

    let total = 0;

    for (const item of dto.items) {
      const stock = await this.prisma.branchStock.findFirst({
        where: { itemId: item.itemId, branchId },
      });

      if (!stock || Number(stock.quantity) < item.quantity) {
        throw new BadRequestException(`Stock insuficiente para item ${item.itemId}`);
      }

      const newQty = Number(stock.quantity) - item.quantity;

      await this.prisma.branchStock.update({
        where: { id: stock.id },
        data: { quantity: newQty },
      });

      await this.prisma.inventoryMovement.create({
        data: {
          companyId,
          branchId,
          itemId: item.itemId,
          createdById: userId,
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

    return this.prisma.sale.update({
      where: { id: sale.id },
      data: { total, subtotal: total },
      include: {
        customer: true,
        details: { include: { item: true } },
      },
    });
  }

  async findAll(userId: number) {
    const { companyId } = await this.getUserContext(userId);
    return this.prisma.sale.findMany({
      where: { companyId },
      include: {
        customer: true,
        details: { include: { item: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: number, id: number) {
    const { companyId } = await this.getUserContext(userId);
    const sale = await this.prisma.sale.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        details: { include: { item: true } },
        returns: { include: { details: { include: { item: true } } } },
      },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }

  async createReturn(userId: number, saleId: number, dto: CreateReturnDto) {
    const { companyId } = await this.getUserContext(userId);

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, companyId },
      include: {
        details: true,
        returns: { include: { details: true } },
      },
    });

    if (!sale) throw new BadRequestException('Venta no encontrada');

    const returnedByItem = new Map<number, number>();
    for (const ret of sale.returns) {
      for (const det of ret.details) {
        returnedByItem.set(det.itemId, (returnedByItem.get(det.itemId) ?? 0) + Number(det.quantity));
      }
    }

    const ret = await this.prisma.saleReturn.create({
      data: {
        companyId,
        branchId: sale.branchId,
        saleId,
        customerId: sale.customerId,
        createdById: userId,
        systemNumber: `DEV-${Date.now()}`,
      },
    });

    for (const item of dto.items) {
      const soldDetail = sale.details.find((d) => d.itemId === item.itemId);
      if (!soldDetail) throw new BadRequestException(`El item ${item.itemId} no pertenece a la venta`);

      const soldQty = Number(soldDetail.quantity);
      const prevReturned = returnedByItem.get(item.itemId) ?? 0;
      if (prevReturned + item.quantity > soldQty) {
        throw new BadRequestException(`No puedes devolver mas de lo vendido para item ${item.itemId}`);
      }

      const stock = await this.prisma.branchStock.findFirst({
        where: { itemId: item.itemId, branchId: sale.branchId },
      });

      if (!stock) {
        throw new BadRequestException(`Stock no inicializado para item ${item.itemId} en la sede`);
      }

      const newQty = Number(stock.quantity) + item.quantity;

      await this.prisma.branchStock.update({ where: { id: stock.id }, data: { quantity: newQty } });

      await this.prisma.inventoryMovement.create({
        data: {
          companyId,
          branchId: sale.branchId,
          itemId: item.itemId,
          createdById: userId,
          type: 'RETURN_SALE',
          quantity: item.quantity,
          balanceAfter: newQty,
          reference: ret.systemNumber,
        },
      });

      await this.prisma.saleReturnDetail.create({
        data: {
          saleReturnId: ret.id,
          saleDetailId: soldDetail.id,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: soldDetail.unitPrice,
          subtotal: Number(soldDetail.unitPrice) * item.quantity,
        },
      });
    }

    return this.prisma.saleReturn.findUnique({
      where: { id: ret.id },
      include: { details: { include: { item: true } }, sale: true },
    });
  }

  async getReport(userId: number, from?: string, to?: string) {
    const { companyId } = await this.getUserContext(userId);

    const where: any = { companyId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
      if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: { customer: true, details: { include: { item: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.total), 0);

    const byDayMap = new Map<string, { date: string; total: number; count: number }>();
    const topProductsMap = new Map<string, { itemId: number; name: string; quantity: number; total: number }>();

    for (const sale of sales) {
      const date = sale.createdAt.toISOString().slice(0, 10);
      const current = byDayMap.get(date) ?? { date, total: 0, count: 0 };
      current.total += Number(sale.total);
      current.count += 1;
      byDayMap.set(date, current);

      for (const detail of sale.details) {
        const key = String(detail.itemId);
        const itemCurrent = topProductsMap.get(key) ?? {
          itemId: detail.itemId,
          name: detail.item?.name ?? `Item ${detail.itemId}`,
          quantity: 0,
          total: 0,
        };
        itemCurrent.quantity += Number(detail.quantity);
        itemCurrent.total += Number(detail.subtotal);
        topProductsMap.set(key, itemCurrent);
      }
    }

    const byDay = Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      filters: { from: from ?? null, to: to ?? null },
      summary: {
        totalSales,
        totalRevenue,
        averageTicket: totalSales ? Number((totalRevenue / totalSales).toFixed(2)) : 0,
      },
      byDay,
      topProducts,
      sales,
    };
  }
}

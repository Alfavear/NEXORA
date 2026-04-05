import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    let calculatedTotal = 0;

    for (const item of dto.items) {
      const product = await this.prisma.item.findUnique({ where: { id: item.itemId } });      if (!product) {
        throw new BadRequestException(`Producto ${item.itemId} no encontrado`);
      }

      const stock = await this.prisma.branchStock.findFirst({
        where: { itemId: item.itemId, branchId },
      });

      if (!stock || Number(stock.quantity) < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para item ${item.itemId}`,
        );
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

      const isGift = Boolean((item as any).isGift);
      const itemPrice = isGift ? 0 : Number(item.unitPrice);
      const lineSubtotal = item.quantity * itemPrice;

      calculatedSubtotal += lineSubtotal;

      await this.prisma.saleDetail.create({
        data: {
          saleId: sale.id,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: itemPrice,
          subtotal: lineSubtotal,
          isGift,
        },
      });
    }

    // New Tax Calculation Logic
    if (dto.taxIds && dto.taxIds.length > 0) {
      const taxes = await this.prisma.tax.findMany({
        where: {
          id: { in: dto.taxIds },
          companyId,
          isActive: true,
        },
      });

      for (const tax of taxes) {
        calculatedTax += calculatedSubtotal * (Number(tax.rate) / 100);
      }
    }
    calculatedTotal = calculatedSubtotal + calculatedTax;

    const isCredit = Boolean(dto.isCredit);
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    const payments = dto.payments || [];
    
    let paidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    let interestAmount = 0;
    if (isCredit && dto.interestRate && dto.interestRate > 0) {
      const financedAmount = calculatedTotal - paidAmount;
      if (financedAmount > 0) {
        interestAmount = financedAmount * (dto.interestRate / 100);
        calculatedTotal += interestAmount;
      }
    }

    if (isCredit && !dueDate) {
      throw new BadRequestException(
        'La venta a crédito requiere fecha de vencimiento',
      );
    }

    if (paidAmount > calculatedTotal) {
      throw new BadRequestException(
        'La suma total de pagos no puede exceder el total de la venta',
      );
    }

    let outstanding = Number((calculatedTotal - paidAmount).toFixed(2));
    let paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' = 'PAID';

    if (outstanding <= 0) {
      outstanding = 0;
      paymentStatus = 'PAID';
    } else if (paidAmount <= 0) {
      paymentStatus = 'PENDING';
    } else {
      paymentStatus = 'PARTIAL';
    }

    const updatedSale = await this.prisma.sale.update({
      where: { id: sale.id },
      data: {
        subtotal: Number(calculatedSubtotal.toFixed(2)),
        tax: Number(calculatedTax.toFixed(2)),
        total: Number(calculatedTotal.toFixed(2)),
        isCredit,
        dueDate: dueDate ?? null,
        installments: dto.installments || 1,
        interestRate: dto.interestRate || 0,
        lateInterestRate: dto.lateInterestRate || 0,
        interestAmount: Number(interestAmount.toFixed(2)),
        paidAmount,
        outstanding,
        paymentStatus,
      },
    });

    if (dto.taxIds && dto.taxIds.length > 0) {
      await this.prisma.saleTax.createMany({
        data: dto.taxIds.map(taxId => ({
          saleId: updatedSale.id,
          taxId: taxId,
        })),
      });
    }

    // Generación de Tabla de Amortización
    if (isCredit && dto.installments && dto.installments > 0 && dueDate) {
      const financedAmount = Number(calculatedTotal.toFixed(2)) - paidAmount;
      if (financedAmount > 0) {
        const baseQuotaAmount = Math.floor((financedAmount / dto.installments) * 100) / 100;
        let remainingToDistribute = financedAmount;
        let currentDueDate = new Date(dueDate);
        const installmentsData: {
          saleId: number;
          quotaNumber: number;
          dueDate: Date;
          amount: number;
        }[] = [];

        for (let i = 1; i <= dto.installments; i++) {
          let amountForThisQuota = baseQuotaAmount;
          if (i === dto.installments) {
            amountForThisQuota = remainingToDistribute; // La última cuota absorbe los centavos restantes
          } else {
            remainingToDistribute -= baseQuotaAmount;
          }

          installmentsData.push({
            saleId: updatedSale.id,
            quotaNumber: i,
            dueDate: new Date(currentDueDate),
            amount: Number(amountForThisQuota.toFixed(2)),
          });
          // Proyectamos un mes hacia el futuro para la siguiente cuota
          currentDueDate.setMonth(currentDueDate.getMonth() + 1);
        }
        await this.prisma.saleInstallment.createMany({ data: installmentsData });
      }
    }

    for (const payment of payments) {
      if (payment.amount > 0) {
        await this.prisma.salePayment.create({
          data: {
            saleId: sale.id,
            paymentMethodId: payment.paymentMethodId,
            amount: payment.amount,
            notes: 'Abono inicial en venta',
          },
        });
      }
    }

    return this.prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        customer: true,
        branch: true,
        details: { include: { item: true } },
        payments: { include: { paymentMethod: true } },
        saleTaxes: { include: { tax: true } },
        amortization: { orderBy: { quotaNumber: 'asc' } },
      },
    });
  }

  async findAll(userId: number) {
    const { companyId } = await this.getUserContext(userId);
    return this.prisma.sale.findMany({
      where: { companyId },
      include: {
        customer: true,
        branch: true,
        details: { include: { item: true } },
        saleTaxes: { include: { tax: true } },
        amortization: { orderBy: { quotaNumber: 'asc' } },
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
        branch: true,
        details: { include: { item: true } },
        returns: { include: { details: { include: { item: true } } } },
        payments: { include: { paymentMethod: true } },
        saleTaxes: { include: { tax: true } },
        amortization: { orderBy: { quotaNumber: 'asc' } },
      },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }

  async getOutstandingSales(userId: number) {
    const { companyId } = await this.getUserContext(userId);
    return this.prisma.sale.findMany({
      where: { companyId, outstanding: { gt: 0 } },
      include: {
        customer: true,
        branch: true,
        details: { include: { item: true } },
        payments: { include: { paymentMethod: true } },
        saleTaxes: { include: { tax: true } },
        amortization: { orderBy: { quotaNumber: 'asc' } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async listReturns(userId: number) {
    const { companyId } = await this.getUserContext(userId);
    return this.prisma.saleReturn.findMany({
      where: { companyId },
      include: {
        sale: true,
        branch: true,
        customer: true,
        createdBy: true,
        details: { include: { item: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPayment(
    userId: number,
    saleId: number,
    amount: number,
    paymentMethodId: number,
    notes?: string,
  ) {
    const { companyId } = await this.getUserContext(userId);

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, companyId },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');

    if (amount <= 0) {
      throw new BadRequestException('El monto de pago debe ser mayor a 0');
    }

    if (Number(sale.outstanding) <= 0) {
      throw new BadRequestException('La venta ya está saldada');
    }

    const newPaid = Number(sale.paidAmount) + amount;
    const newOutstanding = Number((Number(sale.total) - newPaid).toFixed(2));

    const paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' =
      newOutstanding <= 0
        ? 'PAID'
        : newOutstanding === Number(sale.total)
          ? 'PENDING'
          : 'PARTIAL';

    await this.prisma.salePayment.create({
      data: {
        saleId,
        amount,
        paymentMethodId,
        notes,
      },
    });

    return this.prisma.sale.update({
      where: { id: saleId },
      data: {
        paidAmount: newPaid,
        outstanding: newOutstanding < 0 ? 0 : newOutstanding,
        paymentStatus: paymentStatus as any,
      },
      include: {
        customer: true,
        details: { include: { item: true } },
        payments: { include: { paymentMethod: true } },
      },
    });
  }

  async getPayments(userId: number, saleId: number) {
    const { companyId } = await this.getUserContext(userId);
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, companyId },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');

    return this.prisma.salePayment.findMany({
      where: { saleId },
      orderBy: { createdAt: 'asc' },
    });
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
        returnedByItem.set(
          det.itemId,
          (returnedByItem.get(det.itemId) ?? 0) + Number(det.quantity),
        );
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
      if (!soldDetail)
        throw new BadRequestException(
          `El item ${item.itemId} no pertenece a la venta`,
        );

      const soldQty = Number(soldDetail.quantity);
      const prevReturned = returnedByItem.get(item.itemId) ?? 0;
      if (prevReturned + item.quantity > soldQty) {
        throw new BadRequestException(
          `No puedes devolver mas de lo vendido para item ${item.itemId}`,
        );
      }

      const stock = await this.prisma.branchStock.findFirst({
        where: { itemId: item.itemId, branchId: sale.branchId },
      });

      if (!stock) {
        throw new BadRequestException(
          `Stock no inicializado para item ${item.itemId} en la sede`,
        );
      }

      const newQty = Number(stock.quantity) + item.quantity;

      await this.prisma.branchStock.update({
        where: { id: stock.id },
        data: { quantity: newQty },
      });

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
          reason: item.reason?.trim() || null,
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
    const totalRevenue = sales.reduce(
      (acc, sale) => acc + Number(sale.total),
      0,
    );

    const byDayMap = new Map<
      string,
      { date: string; total: number; count: number }
    >();
    const topProductsMap = new Map<
      string,
      { itemId: number; name: string; quantity: number; total: number }
    >();

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

    const byDay = Array.from(byDayMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      filters: { from: from ?? null, to: to ?? null },
      summary: {
        totalSales,
        totalRevenue,
        averageTicket: totalSales
          ? Number((totalRevenue / totalSales).toFixed(2))
          : 0,
      },
      byDay,
      topProducts,
      sales,
    };
  }

  async getCreditReport(
    userId: number,
    from?: string,
    to?: string,
    customerId?: number,
    branchId?: number,
    status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED',
  ) {
    const { companyId } = await this.getUserContext(userId);

    const where: any = { companyId, outstanding: { gt: 0 } };
    if (from || to) {
      where.dueDate = {};
      if (from) where.dueDate.gte = new Date(`${from}T00:00:00.000Z`);
      if (to) where.dueDate.lte = new Date(`${to}T23:59:59.999Z`);
    }
    if (customerId) where.customerId = customerId;
    if (branchId) where.branchId = branchId;
    if (status) where.paymentStatus = status;

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        customer: true,
        branch: true,
        details: { include: { item: true } },
        payments: { include: { paymentMethod: true } },
        saleTaxes: { include: { tax: true } },
        amortization: { orderBy: { quotaNumber: 'asc' } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const totalDebt = sales.reduce((acc, sale) => acc + Number(sale.outstanding), 0);
    const overdue = sales.filter((sale) => sale.dueDate && new Date(sale.dueDate) < new Date());
    const overdueAmount = overdue.reduce((acc, sale) => acc + Number(sale.outstanding), 0);

    return {
      filters: { from: from ?? null, to: to ?? null },
      summary: {
        totalDebts: sales.length,
        totalDebt: Number(totalDebt.toFixed(2)),
        overdueCount: overdue.length,
        overdueAmount: Number(overdueAmount.toFixed(2)),
      },
      sales,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private round2(value: any): number {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : Number(num.toFixed(2));
  }

  async getSalesReports(companyId: number, filters: { startDate?: string; endDate?: string }) {
    const where: any = { companyId };
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      // Ensure we include the whole end day by moving to start of next day
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        customer: true,
        details: { include: { item: true } },
        payments: { include: { paymentMethod: true } },
        branch: true,
        saleTaxes: { include: { tax: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sales.map((s) => ({
      id: s.id,
      date: s.createdAt,
      documentNumber: s.externalReceiptNumber || s.systemNumber || `VEN-${String(s.id).padStart(5, '0')}`,
      customerName: s.customer?.name || 'Consumidor Final',
      branchName: s.branch?.name || 'Desconocida',
      appliedTaxes: s.saleTaxes?.map((st: any) => `${st.tax?.name} (${Number(st.tax?.rate)}%)`).join(' | ') || '-',
      subtotal: this.round2((s as any).subtotal),
      tax: this.round2(Number((s as any).total || 0) - Number((s as any).subtotal || 0)),
      total: this.round2((s as any).total),
      status: s.paymentStatus || (s as any).status || 'Desconocido',
      units: this.round2(s.details.reduce((acc, d) => acc + Number(d.quantity || 0), 0)),
      payments: s.payments.map((p) => ({ method: p.paymentMethod?.name || 'Desconocido', amount: this.round2(p.amount) })),
      details: s.details.map((d) => ({
        itemId: d.itemId,
        description: d.item?.name || 'Desconocido',
        quantity: this.round2(d.quantity)
      })),
    }));
  }

  async getSalesBySellerReports(companyId: number, filters: { startDate?: string; endDate?: string; sellerId?: number }) {
    const where: any = { companyId };
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }
    if (filters.sellerId) {
      where.sellerId = filters.sellerId;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        seller: true,
        customer: true,
        details: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const summaryBySeller = new Map<number, any>();

    sales.forEach(s => {
      const sId = s.sellerId;
      if (!summaryBySeller.has(sId)) {
        summaryBySeller.set(sId, {
          sellerId: sId,
          sellerName: s.seller?.name || 'Sin Asignar',
          totalSales: 0,
          totalAmount: 0,
          sales: []
        });
      }
      const data = summaryBySeller.get(sId);
      data.totalSales += 1;
      data.totalAmount = this.round2(data.totalAmount + Number((s as any).total || 0));
      data.sales.push({
        id: s.id,
        date: s.createdAt,
        documentNumber: s.externalReceiptNumber || s.systemNumber,
        customerName: s.customer?.name || 'Consumidor Final',
        total: this.round2((s as any).total)
      });
    });

    return Array.from(summaryBySeller.values());
  }

  async getCustomerStatementReport(companyId: number, customerId: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId }
    });
    
    if (!customer) throw new Error('Customer not found');

    const sales = await this.prisma.sale.findMany({
      where: { companyId, customerId, outstanding: { gt: 0 } },
      include: {
        payments: {
          include: { paymentMethod: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    let totalDebt = 0;
    
    const statement = sales.map(s => {
      totalDebt = this.round2(totalDebt + Number(s.outstanding || 0));
      return {
        id: s.id,
        date: s.createdAt,
        dueDate: s.dueDate,
        documentNumber: s.externalReceiptNumber || s.systemNumber,
        total: this.round2(s.total),
        paidAmount: this.round2(s.paidAmount),
        outstanding: this.round2(s.outstanding),
        payments: s.payments.map(p => ({
          date: p.createdAt,
          amount: this.round2(p.amount),
          method: p.paymentMethod?.name || 'Desconocido'
        }))
      };
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        document: customer.document,
        phone: customer.phone,
        address: customer.address
      },
      totalOutstanding: totalDebt,
      statement: statement
    };
  }

  async getCollectionsReport(companyId: number, filters: { startDate?: string; endDate?: string }) {
    const where: any = { sale: { companyId } };
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    const payments = await this.prisma.salePayment.findMany({
      where,
      include: {
        paymentMethod: true,
        sale: {
          include: { customer: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map(p => ({
      id: p.id,
      date: p.createdAt,
      method: p.paymentMethod?.name || 'Desconocido',
      amount: this.round2(p.amount),
      notes: p.notes,
      saleDocument: p.sale.externalReceiptNumber || p.sale.systemNumber,
      customerName: p.sale.customer?.name || 'Consumidor Final'
    }));
  }

  async getKardexReport(companyId: number, filters: { itemId?: number; branchId?: number; startDate?: string; endDate?: string }) {
    const where: any = { companyId };
    if (filters.itemId) where.itemId = filters.itemId;
    if (filters.branchId) where.branchId = filters.branchId;
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    const movements = await this.prisma.inventoryMovement.findMany({
      where,
      include: {
        item: true,
        branch: true,
        createdBy: true
      },
      orderBy: { createdAt: 'asc' },
    });

    return movements.map(m => ({
      id: m.id,
      date: m.createdAt,
      type: m.type,
      itemCode: m.item.sku || m.item.barcode || String(m.item.id),
      itemName: m.item.name,
      branchName: m.branch?.name || 'Sede Desconocida',
      quantity: this.round2(m.quantity),
      balanceAfter: this.round2(m.balanceAfter),
      cost: this.round2((m.item as any).costPrice),
      reference: m.reference,
      user: m.createdBy?.name || 'Sistema'
    }));
  }

  async getInventoryReports(companyId: number, branchId?: number) {
    // Kardex / Stock Report
    const products = await this.prisma.item.findMany({
      where: { companyId },
      include: {
        category: true,
        stocks: branchId ? { where: { branchId } } : true,
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ({
      id: p.id,
      code: p.barcode || String(p.id),
      name: p.name,
      category: p.category?.name || '-',
      stock: this.round2(p.stocks.reduce((acc, s) => acc + Number(s.quantity || 0), 0)),
      cost: this.round2((p as any).costPrice),
      price: this.round2(p.salePrice || p.basePrice),
      isActive: p.isActive,
    }));
  }

  async getCustomersReports(companyId: number) {
    const customers = await this.prisma.customer.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    return customers.map((c) => ({
      id: c.id,
      identification: c.document || 'N/A',
      name: c.name,
      email: c.email || 'N/A',
      phone: c.phone || 'N/A',
      address: c.address || 'N/A',
      creditLimit: this.round2((c as any).creditLimit),
      isActive: c.isActive,
    }));
  }

  async getInvoiceReprints(
    companyId: number,
    from?: string,
    to?: string,
    customerId?: number,
    systemNumber?: string,
  ) {
    const where: any = { companyId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }
    if (customerId) where.customerId = customerId;
    if (systemNumber) where.systemNumber = { contains: systemNumber, mode: 'insensitive' };

    const items = await this.prisma.sale.findMany({
      where,
      include: {
        customer: true,
        seller: true,
        branch: true,
        details: { include: { item: true } },
        payments: { include: { paymentMethod: true } },
        saleTaxes: { include: { tax: true } },
        amortization: { orderBy: { quotaNumber: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return items.map((item) => ({
      ...item,
      tax: this.round2(Number((item as any).total || 0) - Number((item as any).subtotal || 0)),
    }));
  }

  async getReturnReprints(
    companyId: number,
    from?: string,
    to?: string,
    customerId?: number,
    systemNumber?: string,
  ) {
    const where: any = { companyId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }
    if (customerId) where.customerId = customerId;
    if (systemNumber) where.systemNumber = { contains: systemNumber, mode: 'insensitive' };

    const items = await this.prisma.saleReturn.findMany({
      where,
      include: {
        customer: true,
        createdBy: true,
        branch: true,
        details: { include: { item: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return items.map((item) => ({
      ...item,
      tax: this.round2(Number((item as any).total || 0) - Number((item as any).subtotal || 0)),
    }));
  }

  async getSalesVolumeReport(companyId: number, filters: { year?: number; month?: number; startDate?: string; endDate?: string }) {

    let startDate: Date;
    let endDate: Date;
    let periodLabel = '';

    if (filters.startDate && filters.endDate) {
      startDate = new Date(`${filters.startDate}T00:00:00.000Z`);
      endDate = new Date(`${filters.endDate}T23:59:59.999Z`);
      periodLabel = `${filters.startDate} a ${filters.endDate}`;
    } else {
      const year = filters.year || new Date().getFullYear();
      if (filters.month) {
        startDate = new Date(year, filters.month - 1, 1);
        endDate = new Date(year, filters.month, 0, 23, 59, 59, 999);
        periodLabel = `Mes: ${String(filters.month).padStart(2, '0')}/${year}`;
      } else {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        periodLabel = `Año: ${year}`;
      }
    }

    const sales = await this.prisma.sale.findMany({
      where: {
        companyId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
      include: { details: { include: { item: true } } },
    });

    let totalRevenue = 0;
    const totalSales = sales.length;

    const breakdownMap = new Map<string, { revenue: number; count: number; name: string }>();
    const productMap = new Map<number, { name: string; sku: string; quantity: number; revenue: number }>();

    const isDaily = (endDate.getTime() - startDate.getTime()) <= (32 * 24 * 60 * 60 * 1000);

    sales.forEach((s) => {
      const total = Number((s as any).total || 0);
      totalRevenue += total;

      let periodKey = '';
      let periodName = '';
      const y = s.createdAt.getFullYear();
      const m = String(s.createdAt.getMonth() + 1).padStart(2, '0');
      const d = String(s.createdAt.getDate()).padStart(2, '0');

      if (isDaily) {
        periodKey = `${y}-${m}-${d}`;
        periodName = `${d}/${m}`;
      } else {
        periodKey = `${y}-${m}`;
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        periodName = `${monthNames[s.createdAt.getMonth()]} ${y}`;
      }

      if (!breakdownMap.has(periodKey)) breakdownMap.set(periodKey, { revenue: 0, count: 0, name: periodName });
      const b = breakdownMap.get(periodKey)!;
      b.revenue += total;
      b.count += 1;

      s.details.forEach((d) => {
        const qty = Number(d.quantity || 0);
        const sub = Number(d.subtotal || 0);
        const pId = d.itemId;

        if (!productMap.has(pId)) {
          productMap.set(pId, { name: d.item?.name || 'Desconocido', sku: d.item?.sku || '-', quantity: 0, revenue: 0 });
        }
        const p = productMap.get(pId)!;
        p.quantity += qty;
        p.revenue += sub;
      });
    });

    const breakdown = Array.from(breakdownMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => ({ period: val.name, revenue: this.round2(val.revenue), salesCount: val.count }));

    let bestPeriod = '-';
    let maxRev = -1;
    breakdown.forEach((b) => {
      if (b.revenue > maxRev) { maxRev = b.revenue; bestPeriod = b.period; }
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(p => ({ ...p, quantity: this.round2(p.quantity), revenue: this.round2(p.revenue) }));

    return {
      summary: { periodLabel, totalRevenue: this.round2(totalRevenue), totalSales, bestPeriod },
      breakdown, topProducts,
    };
  }
}

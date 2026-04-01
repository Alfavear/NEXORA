import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReports(filters: { startDate?: string; endDate?: string }) {
    const where: Prisma.SaleWhereInput = {};
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return sales.map((s) => ({
      id: s.id,
      date: s.createdAt,
      documentNumber: s.externalReceiptNumber || s.systemNumber || `VEN-${String(s.id).padStart(5, '0')}`,
      customerName: s.customer?.name || 'Consumidor Final',
      subtotal: Number(s.subtotal),
      tax: 0,
      total: Number(s.total),
      status: s.paymentStatus || s.status,
      units: s.details.reduce((acc, d) => acc + Number(d.quantity), 0),
      payments: s.payments.map((p) => ({ method: p.paymentMethod?.name || 'Desconocido', amount: Number(p.amount) })),
      details: s.details.map((d) => ({
        itemId: d.itemId,
        description: d.item?.name || 'Desconocido',
        quantity: Number(d.quantity)
      })),
    }));
  }

  async getSalesBySellerReports(filters: { startDate?: string; endDate?: string; sellerId?: number }) {
    const where: Prisma.SaleWhereInput = {};
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
          sellerName: s.seller.name,
          totalSales: 0,
          totalAmount: 0,
          sales: []
        });
      }
      const data = summaryBySeller.get(sId);
      data.totalSales += 1;
      data.totalAmount += Number(s.total);
      data.sales.push({
        id: s.id,
        date: s.createdAt,
        documentNumber: s.externalReceiptNumber || s.systemNumber,
        customerName: s.customer?.name || 'Consumidor Final',
        total: Number(s.total)
      });
    });

    return Array.from(summaryBySeller.values());
  }

  async getCustomerStatementReport(customerId: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId }
    });
    
    if (!customer) throw new Error('Customer not found');

    const sales = await this.prisma.sale.findMany({
      where: { customerId, outstanding: { gt: 0 } },
      include: {
        payments: {
          include: { paymentMethod: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    let totalDebt = 0;
    
    const statement = sales.map(s => {
      totalDebt += Number(s.outstanding);
      return {
        id: s.id,
        date: s.createdAt,
        dueDate: s.dueDate,
        documentNumber: s.externalReceiptNumber || s.systemNumber,
        total: Number(s.total),
        paidAmount: Number(s.paidAmount),
        outstanding: Number(s.outstanding),
        payments: s.payments.map(p => ({
          date: p.createdAt,
          amount: Number(p.amount),
          method: p.paymentMethod.name
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
      statement
    };
  }

  async getCollectionsReport(filters: { startDate?: string; endDate?: string }) {
    const where: Prisma.SalePaymentWhereInput = {};
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
      method: p.paymentMethod.name,
      amount: Number(p.amount),
      notes: p.notes,
      saleDocument: p.sale.externalReceiptNumber || p.sale.systemNumber,
      customerName: p.sale.customer?.name || 'Consumidor Final'
    }));
  }

  async getKardexReport(filters: { itemId?: number; branchId?: number; startDate?: string; endDate?: string }) {
    const where: Prisma.InventoryMovementWhereInput = {};
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
      branchName: m.branch.name,
      quantity: Number(m.quantity),
      balanceAfter: Number(m.balanceAfter),
      reference: m.reference,
      user: m.createdBy?.name || 'Sistema'
    }));
  }

  async getInventoryReports() {
    // Kardex / Stock Report
    const products = await this.prisma.item.findMany({
      include: {
        category: true,
        stocks: true,
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ({
      id: p.id,
      code: p.barcode || String(p.id),
      name: p.name,
      category: p.category?.name || '-',
      stock: p.stocks.reduce((acc, s) => acc + Number(s.quantity), 0),
      price: Number(p.salePrice || p.basePrice || 0),
      isActive: p.isActive,
    }));
  }

  async getCustomersReports() {
    const customers = await this.prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });

    return customers.map((c) => ({
      id: c.id,
      identification: c.document || 'N/A',
      name: c.name,
      email: c.email || 'N/A',
      phone: c.phone || 'N/A',
      address: c.address || 'N/A',
      creditLimit: 0,
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
        payments: { include: { paymentMethod: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return items;
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

    return items;
  }
}

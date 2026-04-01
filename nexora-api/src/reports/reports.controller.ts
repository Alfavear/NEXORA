import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  async getSales(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getSalesReports({ startDate, endDate });
  }

  @Get('sales-by-seller')
  async getSalesBySeller(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Query('sellerId') sellerId?: string) {
    return this.reportsService.getSalesBySellerReports({ startDate, endDate, sellerId: sellerId ? Number(sellerId) : undefined });
  }

  @Get('customer-statement')
  async getCustomerStatement(@Query('customerId') customerId: string) {
    return this.reportsService.getCustomerStatementReport(Number(customerId));
  }

  @Get('collections')
  async getCollections(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getCollectionsReport({ startDate, endDate });
  }

  @Get('kardex')
  getKardex(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('productId') productId?: string,
  ) {
    return this.reportsService.getKardexReport({
      itemId: productId ? Number(productId) : undefined,
      branchId: branchId ? Number(branchId) : undefined,
      startDate: from,
      endDate: to,
    });
  }

  @Get('invoice-reprints')
  getInvoiceReprints(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('customerId') customerId?: string,
    @Query('systemNumber') systemNumber?: string,
  ) {
    return this.reportsService.getInvoiceReprints(
      req.user.sub,
      from,
      to,
      customerId ? Number(customerId) : undefined,
      systemNumber,
    );
  }

  @Get('return-reprints')
  getReturnReprints(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('customerId') customerId?: string,
    @Query('systemNumber') systemNumber?: string,
  ) {
    return this.reportsService.getReturnReprints(
      req.user.sub,
      from,
      to,
      customerId ? Number(customerId) : undefined,
      systemNumber,
    );
  }

  @Get('inventory')
  async getInventory() {
    return this.reportsService.getInventoryReports();
  }

  @Get('customers')
  async getCustomers() {
    return this.reportsService.getCustomersReports();
  }
}

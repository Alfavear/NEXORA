import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === 'undefined' || value === 'null' || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  private parseString(value: any): string | undefined {
    if (value === undefined || value === null || value === 'undefined' || value === 'null' || value === '') {
      return undefined;
    }
    return String(value);
  }

  @Get('sales')
  async getSales(@Req() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getSalesReports(req.user.companyId, { 
      startDate: this.parseString(startDate), 
      endDate: this.parseString(endDate) 
    });
  }

  @Get('sales-by-seller')
  async getSalesBySeller(@Req() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Query('sellerId') sellerId?: string) {
    return this.reportsService.getSalesBySellerReports(req.user.companyId, { 
      startDate: this.parseString(startDate), 
      endDate: this.parseString(endDate), 
      sellerId: this.parseNumber(sellerId) 
    });
  }

  @Get('customer-statement')
  async getCustomerStatement(@Req() req: any, @Query('customerId') customerId: string) {
    return this.reportsService.getCustomerStatementReport(req.user.companyId, this.parseNumber(customerId) || 0);
  }

  @Get('sales-volume')
  async getSalesVolume(
    @Req() req: any,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSalesVolumeReport(req.user.companyId, {
      year: this.parseNumber(year),
      month: this.parseNumber(month),
      startDate: this.parseString(startDate),
      endDate: this.parseString(endDate),
    });
  }

  @Get('collections')
  async getCollections(@Req() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportsService.getCollectionsReport(req.user.companyId, { 
      startDate: this.parseString(startDate), 
      endDate: this.parseString(endDate) 
    });
  }

  @Get('kardex')
  getKardex(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('productId') productId?: string,
  ) {
    return this.reportsService.getKardexReport(req.user.companyId, {
      itemId: this.parseNumber(productId),
      branchId: this.parseNumber(branchId),
      startDate: this.parseString(from),
      endDate: this.parseString(to),
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
      req.user.companyId,
      from,
      to,
      this.parseNumber(customerId),
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
      req.user.companyId,
      from,
      to,
      this.parseNumber(customerId),
      systemNumber,
    );
  }

  @Get('inventory')
  async getInventory(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.reportsService.getInventoryReports(req.user.companyId, this.parseNumber(branchId));
  }

  @Get('customers')
  async getCustomers(@Req() req: any) {
    return this.reportsService.getCustomersReports(req.user.companyId);
  }
}

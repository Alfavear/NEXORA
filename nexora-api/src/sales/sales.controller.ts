import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateSaleDto) {
    return this.service.createSale(req.user.sub, req.user.branchId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.sub);
  }

  @Get('report')
  report(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getReport(req.user.sub, from, to);
  }

  @Get('credits')
  outstanding(@Req() req: any) {
    return this.service.getOutstandingSales(req.user.sub);
  }

  @Get('credits/report')
  creditReport(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('customerId') customerId?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED',
  ) {
    return this.service.getCreditReport(
      req.user.sub,
      from,
      to,
      customerId ? Number(customerId) : undefined,
      branchId ? Number(branchId) : undefined,
      status,
    );
  }

  @Post(':id/payments')
  createPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateSalePaymentDto,
  ) {
    return this.service.createPayment(
      req.user.sub,
      Number(id),
      dto.amount,
      dto.paymentMethodId,
      dto.notes,
    );
  }

  @Get(':id/payments')
  getPayments(@Req() req: any, @Param('id') id: string) {
    return this.service.getPayments(req.user.sub, Number(id));
  }

  @Get('returns')
  listReturns(@Req() req: any) {
    return this.service.listReturns(req.user.sub);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.sub, Number(id));
  }

  @Post(':id/returns')
  createReturn(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateReturnDto,
  ) {
    return this.service.createReturn(req.user.sub, Number(id), dto);
  }
}

import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateReturnDto } from './dto/create-return.dto';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateSaleDto) {
    return this.service.createSale(req.user.sub, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.sub, Number(id));
  }

  @Post(':id/returns')
  createReturn(@Req() req: any, @Param('id') id: string, @Body() dto: CreateReturnDto) {
    return this.service.createReturn(req.user.sub, Number(id), dto);
  }
}

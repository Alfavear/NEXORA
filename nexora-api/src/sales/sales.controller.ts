import { Controller, Post, Body, Req } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const userId = req.user?.id || 1;
    return this.salesService.createSale(userId, body);
  }
}

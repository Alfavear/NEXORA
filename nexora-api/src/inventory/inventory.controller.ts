import { Controller, Get, Query, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('kardex')
  kardex(@Req() req: any, @Query('itemId') itemId: string) {
    return this.service.kardex(req.user?.sub ?? 1, Number(itemId));
  }
}

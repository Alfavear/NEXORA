import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InventoryService } from './inventory.service';
import { TransferItemDto } from './dto/transfer-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('kardex')
  kardex(@Req() req: any, @Query('itemId') itemId: string) {
    return this.service.kardex(req.user?.sub ?? 1, Number(itemId));
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('transfer')
  transfer(@Req() req: any, @Body() dto: TransferItemDto) {
    return this.service.transfer(req.user.sub, dto);
  }
}

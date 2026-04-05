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
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InventoryService } from './inventory.service';
import { TransferItemDto } from './dto/transfer-item.dto';
import { AdjustItemDto, ApproveAdjustmentDto } from './dto/adjust-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('kardex')
  kardex(
    @Req() req: any,
    @Query('itemId') itemId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.service.kardex(
      req.user?.sub ?? 1,
      Number(itemId),
      branchId ? Number(branchId) : undefined,
    );
  }

  @Get('adjustments')
  getAdjustments(@Req() req: any, @Query('status') status?: string) {
    return this.service.listAdjustments(req.user.sub, status);
  }

  @Post('adjustments')
  createAdjustment(@Req() req: any, @Body() dto: AdjustItemDto) {
    return this.service.createAdjustment(req.user.sub, dto, req.user.branchId);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('adjustments/:id/approve')
  approveAdjustment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApproveAdjustmentDto,
  ) {
    return this.service.approveAdjustment(req.user.sub, Number(id), dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('transfer')
  transfer(@Req() req: any, @Body() dto: TransferItemDto) {
    return this.service.transfer(req.user.sub, dto);
  }
}

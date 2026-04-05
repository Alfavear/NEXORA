import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Req() req, @Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchasesService.create(req.user, createPurchaseDto);
  }

  @Get()
  findAll(@Req() req) {
    return this.purchasesService.findAll(req.user);
  }
}

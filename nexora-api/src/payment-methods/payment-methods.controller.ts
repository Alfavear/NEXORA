import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  create(@Request() req, @Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(req.user.companyId, createPaymentMethodDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.paymentMethodsService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.paymentMethodsService.findOne(req.user.companyId, +id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updatePaymentMethodDto: UpdatePaymentMethodDto) {
    return this.paymentMethodsService.update(req.user.companyId, +id, updatePaymentMethodDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.paymentMethodsService.remove(req.user.companyId, +id);
  }
}

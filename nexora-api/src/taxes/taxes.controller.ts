import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post()
  create(@Request() req, @Body() createTaxDto: CreateTaxDto) {
    return this.taxesService.create(req.user.sub, createTaxDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.taxesService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.taxesService.findOne(req.user.sub, +id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateTaxDto: UpdateTaxDto) {
    return this.taxesService.update(req.user.sub, +id, updateTaxDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.taxesService.remove(req.user.sub, +id);
  }
}
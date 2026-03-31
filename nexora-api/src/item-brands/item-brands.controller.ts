import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ItemBrandsService } from './item-brands.service';
import { CreateItemBrandDto } from './dto/create-item-brand.dto';
import { UpdateItemBrandDto } from './dto/update-item-brand.dto';

@UseGuards(JwtAuthGuard)
@Controller('item-brands')
export class ItemBrandsController {
  constructor(private service: ItemBrandsService) {}

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Request() req: any, @Body() dto: CreateItemBrandDto) {
    return this.service.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.sub, Number(id));
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateItemBrandDto) {
    return this.service.update(req.user.sub, Number(id), dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.sub, Number(id));
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemsController {
  constructor(private service: ItemsService) {}

  // ADMIN crea
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Request() req: any, @Body() dto: CreateItemDto) {
    return this.service.create(req.user.sub, dto);
  }

  // ADMIN/VENDEDOR leen con filtros
  @Get()
  findAll(
    @Request() req: any,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.findAll(req.user.sub, {
      q: q?.trim() || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      type: type || undefined,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.sub, Number(id));
  }

  // ADMIN actualiza
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.service.update(req.user.sub, Number(id), dto);
  }

  // ADMIN elimina (soft)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.sub, Number(id));
  }
}

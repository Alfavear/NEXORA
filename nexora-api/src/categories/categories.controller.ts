import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  // ADMIN crea
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Request() req: any, @Body() dto: CreateCategoryDto) {
    return this.service.create(req.user.sub, dto);
  }

  // ADMIN/VENDEDOR leen
  @Get()
  findAll(@Request() req: any, @Query('isActive') isActive?: string) {
    const parsed = isActive === undefined ? undefined : isActive === 'true';
    return this.service.findAll(req.user.sub, parsed);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.sub, Number(id));
  }

  // ADMIN actualiza
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
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

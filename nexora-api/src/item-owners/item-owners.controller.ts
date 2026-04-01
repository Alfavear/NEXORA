import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ItemOwnersService } from './item-owners.service';
import { CreateItemOwnerDto } from './dto/create-item-owner.dto';
import { UpdateItemOwnerDto } from './dto/update-item-owner.dto';

@UseGuards(JwtAuthGuard)
@Controller('item-owners')
export class ItemOwnersController {
  constructor(private service: ItemOwnersService) {}

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Request() req: any, @Body() dto: CreateItemOwnerDto) {
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
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateItemOwnerDto,
  ) {
    return this.service.update(req.user.sub, Number(id), dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.sub, Number(id));
  }
}

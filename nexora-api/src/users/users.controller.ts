import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserBranchesDto } from './dto/update-user-branches.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto, @Request() req: any) {
    return this.usersService.createVendedor(dto, req.user);
  }

  @Get()
  list(@Request() req: any) {
    return this.usersService.list(req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: any,
  ) {
    return this.usersService.updateUser(Number(id), dto, req.user);
  }

  @Put(':id/branches')
  replaceBranches(
    @Param('id') id: string,
    @Body() dto: UpdateUserBranchesDto,
    @Request() req: any,
  ) {
    return this.usersService.replaceBranches(Number(id), dto, req.user);
  }
}

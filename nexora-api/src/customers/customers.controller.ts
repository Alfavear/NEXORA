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
  Request 
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private service: CustomersService) {}

  // VENDEDOR puede crear clientes
  @Post()
  create(@Request() req: any, @Body() dto: CreateCustomerDto) {
    return this.service.create(req.user.sub, dto);
  }

  // Todos pueden leer clientes
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
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
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

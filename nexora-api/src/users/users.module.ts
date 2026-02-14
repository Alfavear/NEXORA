import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersMeController } from './users-me.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController,UsersMeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { ItemOwnersController } from './item-owners.controller';
import { ItemOwnersService } from './item-owners.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ItemOwnersController],
  providers: [ItemOwnersService],
})
export class ItemOwnersModule {}

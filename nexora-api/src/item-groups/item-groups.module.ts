import { Module } from '@nestjs/common';
import { ItemGroupsController } from './item-groups.controller';
import { ItemGroupsService } from './item-groups.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ItemGroupsController],
  providers: [ItemGroupsService],
})
export class ItemGroupsModule {}

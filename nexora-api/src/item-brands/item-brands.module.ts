import { Module } from '@nestjs/common';
import { ItemBrandsController } from './item-brands.controller';
import { ItemBrandsService } from './item-brands.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ItemBrandsController],
  providers: [ItemBrandsService],
})
export class ItemBrandsModule {}

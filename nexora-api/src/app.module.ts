import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CustomersModule } from './customers/customers.module';
import { CategoriesModule } from './categories/categories.module';
import { ItemsModule } from './items/items.module';
import { SalesModule } from './sales/sales.module';
import { InventoryModule } from './inventory/inventory.module';
import { BranchesModule } from './branches/branches.module';
import { RolesModule } from './roles/roles.module';
import { ItemGroupsModule } from './item-groups/item-groups.module';
import { ItemBrandsModule } from './item-brands/item-brands.module';
import { ItemOwnersModule } from './item-owners/item-owners.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { ReportsModule } from './reports/reports.module';
import { PurchasesModule } from './purchases/purchases.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    SuppliersModule,
    CustomersModule,
    CategoriesModule,
    ItemsModule,
    SalesModule,
    InventoryModule,
    BranchesModule,
    RolesModule,
    ItemGroupsModule,
    ItemBrandsModule,
    ItemOwnersModule,
    PaymentMethodsModule,
    ReportsModule,
    PurchasesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

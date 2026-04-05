import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: any, dto: CreatePurchaseDto) {
    if (!dto.details || dto.details.length === 0) {
      throw new BadRequestException('Purchase must contain at least one item');
    }

    const total = dto.details.reduce((acc, dt) => acc + (dt.quantity * dt.unitCost), 0);

    return await this.prisma.$transaction(async (tx) => {
      // Create the purchase and details
      const purchase = await tx.purchase.create({
        data: {
          companyId: user.companyId,
          branchId: dto.branchId,
          supplierId: dto.supplierId,
          createdById: user.userId,
          systemNumber: dto.systemNumber,
          supplierInvoiceNumber: dto.supplierInvoiceNumber,
          subtotal: total,
          total,
          notes: dto.notes,
          details: {
            create: dto.details.map((d) => ({
              itemId: d.itemId,
              quantity: d.quantity,
              unitCost: d.unitCost,
              subtotal: d.quantity * d.unitCost
            }))
          }
        },
        include: {
          details: true,
          supplier: true,
        }
      });

      // Adjust Cost prices of items optionally or at least record movement
      for (const item of dto.details) {
         // Update costPrice to latest purchased price (Moving Average can be complex for now we just take the last buy price for costPrice referencing)
         await tx.item.update({
           where: { id: item.itemId },
           data: {
             costPrice: item.unitCost
           }
         });

         const stock = await tx.branchStock.upsert({
            where: {
              branchId_itemId: { branchId: dto.branchId, itemId: item.itemId }
            },
            update: {
              quantity: { increment: item.quantity }
            },
            create: {
               branchId: dto.branchId,
               itemId: item.itemId,
               quantity: item.quantity
            }
         });

         await tx.inventoryMovement.create({
           data: {
             companyId: user.companyId,
             branchId: dto.branchId,
             itemId: item.itemId,
             createdById: user.userId,
             type: 'ADJUSTMENT_IN',
             quantity: item.quantity,
             balanceAfter: stock.quantity,
             reference: `COMPRA-${purchase.id}-${dto.systemNumber}`,
             notes: dto.notes
           }
         });
      }

      return purchase;
    });
  }

  async findAll(user: any) {
    return this.prisma.purchase.findMany({
      where: { companyId: user.companyId },
      include: {
        supplier: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }
}

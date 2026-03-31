import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransferItemDto } from './dto/transfer-item.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private async getActorCompanyId(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
    if (!user) throw new BadRequestException('Usuario inválido');
    return user.companyId;
  }

  async kardex(userId: number, itemId: number) {
    if (!itemId) throw new BadRequestException('itemId requerido');

    const movements = await this.prisma.inventoryMovement.findMany({
      where: { itemId },
      include: { item: true },
      orderBy: { createdAt: 'asc' },
    });

    return movements.map((m) => ({
      date: m.createdAt,
      type: m.type,
      quantity: m.quantity,
      balance: m.balanceAfter,
      reference: m.reference,
      itemName: m.item?.name,
    }));
  }

  async transfer(userId: number, dto: TransferItemDto) {
    if (dto.fromBranchId === dto.toBranchId) {
      throw new BadRequestException('fromBranchId y toBranchId deben ser diferentes');
    }

    const companyId = await this.getActorCompanyId(userId);

    const [fromBranch, toBranch, item] = await Promise.all([
      this.prisma.branch.findFirst({ where: { id: dto.fromBranchId, companyId } }),
      this.prisma.branch.findFirst({ where: { id: dto.toBranchId, companyId } }),
      this.prisma.item.findFirst({ where: { id: dto.itemId, companyId } }),
    ]);

    if (!fromBranch || !toBranch) {
      throw new NotFoundException('Sucursal de origen o destino no encontrada');
    }
    if (!item) {
      throw new NotFoundException('Artículo no encontrado');
    }

    const stockFrom = await this.prisma.branchStock.findFirst({
      where: { branchId: dto.fromBranchId, itemId: dto.itemId },
    });

    if (!stockFrom || Number(stockFrom.quantity) < dto.quantity) {
      throw new BadRequestException('Stock insuficiente origen para transferencia');
    }

    const stockTo = await this.prisma.branchStock.findFirst({
      where: { branchId: dto.toBranchId, itemId: dto.itemId },
    });

    return this.prisma.$transaction(async (tx) => {
      const newFromQty = Number(stockFrom.quantity) - dto.quantity;
      await tx.branchStock.update({ where: { id: stockFrom.id }, data: { quantity: newFromQty } });

      const newToQty = Number(stockTo?.quantity ?? 0) + dto.quantity;
      if (stockTo) {
        await tx.branchStock.update({ where: { id: stockTo.id }, data: { quantity: newToQty } });
      } else {
        await tx.branchStock.create({ data: { branchId: dto.toBranchId, itemId: dto.itemId, quantity: dto.quantity } });
      }

      const ref = `TR-${Date.now()}`;

      await tx.inventoryMovement.create({
        data: {
          companyId,
          branchId: dto.fromBranchId,
          itemId: dto.itemId,
          createdById: userId,
          type: 'ADJUSTMENT_OUT',
          quantity: dto.quantity,
          balanceAfter: newFromQty,
          reference: ref,
          notes: `Transferencia a sucursal ${dto.toBranchId}`,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          companyId,
          branchId: dto.toBranchId,
          itemId: dto.itemId,
          createdById: userId,
          type: 'ADJUSTMENT_IN',
          quantity: dto.quantity,
          balanceAfter: newToQty,
          reference: ref,
          notes: `Transferencia desde sucursal ${dto.fromBranchId}`,
        },
      });

      return {
        item: item.name,
        fromBranch: fromBranch.name,
        toBranch: toBranch.name,
        quantity: dto.quantity,
        reference: ref,
      };
    });
  }
}

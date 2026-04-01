import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransferItemDto } from './dto/transfer-item.dto';
import { AdjustItemDto, ApproveAdjustmentDto } from './dto/adjust-item.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private async getActor(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, role: { select: { name: true } } },
    });
    if (!user) throw new BadRequestException('Usuario inválido');
    return { companyId: user.companyId, role: user.role.name };
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
      notes: m.notes,
      itemName: m.item?.name,
    }));
  }

  async listAdjustments(userId: number, status?: string) {
    const { companyId, role } = await this.getActor(userId);
    const where: any = { companyId };
    if (status) where.status = status;

    if (role === 'VENDEDOR') {
      return this.prisma.inventoryAdjustment.findMany({
        where: { ...where, requestedById: userId },
        include: {
          item: true,
          branch: true,
          requestedBy: true,
          approvedBy: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.inventoryAdjustment.findMany({
      where,
      include: {
        item: true,
        branch: true,
        requestedBy: true,
        approvedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdjustment(userId: number, dto: AdjustItemDto, currentBranchId: number) {
    if (!dto.quantity || dto.quantity === 0) {
      throw new BadRequestException('La cantidad debe ser diferente de 0');
    }

    const { companyId, role } = await this.getActor(userId);

    const branchId = dto.branchId || currentBranchId;

    const item = await this.prisma.item.findFirst({
      where: { id: dto.itemId, companyId },
    });
    if (!item) throw new NotFoundException('Artículo no encontrado');

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, companyId },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    if (role === 'ADMIN') {
      const stock = await this.prisma.branchStock.findFirst({
        where: { branchId, itemId: dto.itemId },
      });

      const existingQty = Number(stock?.quantity ?? 0);
      const finalQty = Number(existingQty) + Number(dto.quantity);

      if (finalQty < 0) {
        throw new BadRequestException('Stock insuficiente para ajuste');
      }

      return this.prisma.$transaction(async (tx) => {
        const a = await tx.inventoryAdjustment.create({
          data: {
            companyId,
            branchId,
            itemId: dto.itemId,
            requestedById: userId,
            approvedById: userId,
            quantity: dto.quantity,
            reason: dto.reason?.trim() || null,
            notes: dto.notes?.trim() || null,
            status: 'APPROVED',
            approvedAt: new Date(),
          },
        });

        if (stock) {
          await tx.branchStock.update({
            where: { id: stock.id },
            data: { quantity: finalQty },
          });
        } else {
          await tx.branchStock.create({
            data: {
              branchId,
              itemId: dto.itemId,
              quantity: dto.quantity,
            },
          });
        }

        await tx.inventoryMovement.create({
          data: {
            companyId,
            branchId,
            itemId: dto.itemId,
            createdById: userId,
            type: dto.quantity > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
            quantity: Math.abs(dto.quantity),
            balanceAfter: finalQty,
            reference: `ADJ-${Date.now()}`,
            notes: dto.notes?.trim() || dto.reason?.trim() || null,
          },
        });

        return a;
      });
    }

    // VENDEDOR crea pendiente
    return this.prisma.inventoryAdjustment.create({
      data: {
        companyId,
        branchId,
        itemId: dto.itemId,
        requestedById: userId,
        quantity: dto.quantity,
        reason: dto.reason?.trim() || null,
        notes: dto.notes?.trim() || null,
        status: 'PENDING',
      },
    });
  }

  async approveAdjustment(
    userId: number,
    adjustmentId: number,
    dto: ApproveAdjustmentDto,
  ) {
    const { companyId, role } = await this.getActor(userId);
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Solo ADMIN puede aprobar ajustes');
    }

    const adj = await this.prisma.inventoryAdjustment.findFirst({
      where: { id: adjustmentId, companyId },
    });
    if (!adj) throw new NotFoundException('Ajuste no encontrado');

    if (adj.status !== 'PENDING') {
      throw new BadRequestException('Solo ajustes pendientes se pueden aprobar/rechazar');
    }

    if (!dto.approved && dto.approved !== undefined) {
      return this.prisma.inventoryAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: 'REJECTED',
          approvedById: userId,
          approvedAt: new Date(),
          notes: dto.notes?.trim() || adj.notes,
        },
      });
    }

    const stock = await this.prisma.branchStock.findFirst({
      where: { branchId: adj.branchId, itemId: adj.itemId },
    });

    const existingQty = Number(stock?.quantity ?? 0);
    const finalQty = Number(existingQty) + Number(adj.quantity);
    if (finalQty < 0) {
      throw new BadRequestException('Stock insuficiente para aprobar el ajuste');
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.inventoryAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: 'APPROVED',
          approvedById: userId,
          approvedAt: new Date(),
          notes: dto.notes?.trim() || adj.notes,
        },
      });

      if (stock) {
        await tx.branchStock.update({
          where: { id: stock.id },
          data: { quantity: finalQty },
        });
      } else {
        await tx.branchStock.create({
          data: {
            branchId: adj.branchId,
            itemId: adj.itemId,
            quantity: adj.quantity,
          },
        });
      }

      const adjQuantity = Number(adj.quantity);
      await tx.inventoryMovement.create({
        data: {
          companyId,
          branchId: adj.branchId,
          itemId: adj.itemId,
          createdById: userId,
          type: adjQuantity > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          quantity: Math.abs(adjQuantity),
          balanceAfter: finalQty,
          reference: `ADJ-${adjustmentId}`,
          notes: dto.notes?.trim() || adj.reason || adj.notes,
        },
      });

      return result;
    });
  }

  async transfer(userId: number, dto: TransferItemDto) {
    if (dto.fromBranchId === dto.toBranchId) {
      throw new BadRequestException(
        'fromBranchId y toBranchId deben ser diferentes',
      );
    }

    const companyId = await this.getActor(userId).then((actor) => actor.companyId);

    const [fromBranch, toBranch, item] = await Promise.all([
      this.prisma.branch.findFirst({
        where: { id: dto.fromBranchId, companyId },
      }),
      this.prisma.branch.findFirst({
        where: { id: dto.toBranchId, companyId },
      }),
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
      throw new BadRequestException(
        'Stock insuficiente origen para transferencia',
      );
    }

    const stockTo = await this.prisma.branchStock.findFirst({
      where: { branchId: dto.toBranchId, itemId: dto.itemId },
    });

    return this.prisma.$transaction(async (tx) => {
      const newFromQty = Number(stockFrom.quantity) - dto.quantity;
      await tx.branchStock.update({
        where: { id: stockFrom.id },
        data: { quantity: newFromQty },
      });

      const newToQty = Number(stockTo?.quantity ?? 0) + dto.quantity;
      if (stockTo) {
        await tx.branchStock.update({
          where: { id: stockTo.id },
          data: { quantity: newToQty },
        });
      } else {
        await tx.branchStock.create({
          data: {
            branchId: dto.toBranchId,
            itemId: dto.itemId,
            quantity: dto.quantity,
          },
        });
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

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

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
}

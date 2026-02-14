import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyIdByUser(userId: number) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!u) throw new BadRequestException('Usuario inválido');
    return u.companyId;
  }

  private async assertCategoryInCompany(companyId: number, categoryId: number) {
    const cat = await this.prisma.itemCategory.findFirst({
      where: { id: categoryId, companyId },
      select: { id: true },
    });
    if (!cat) throw new BadRequestException('categoryId inválido');
  }

  async create(userId: number, dto: CreateItemDto) {
    const companyId = await this.getCompanyIdByUser(userId);

    await this.assertCategoryInCompany(companyId, dto.categoryId);

    const name = dto.name.trim();
    const sku = dto.sku?.trim() || null;

    try {
      return await this.prisma.item.create({
        data: {
          companyId,
          categoryId: dto.categoryId,
          name,
          sku,
          type: (dto.type as any) ?? 'MUEBLE',
          description: dto.description?.trim() ?? null,
          basePrice: dto.basePrice ?? null,
        },
        include: { category: { select: { id: true, name: true } } },
      });
    } catch {
      throw new BadRequestException('No se pudo crear (SKU duplicado?)');
    }
  }

  async findAll(userId: number, query: { q?: string; categoryId?: number; type?: string; isActive?: boolean }) {
    const companyId = await this.getCompanyIdByUser(userId);

    return this.prisma.item.findMany({
      where: {
        companyId,
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.type ? { type: query.type as any } : {}),
        ...(typeof query.isActive === 'boolean' ? { isActive: query.isActive } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: 'insensitive' } },
                { sku: { contains: query.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: number, id: number) {
    const companyId = await this.getCompanyIdByUser(userId);

    const item = await this.prisma.item.findFirst({
      where: { id, companyId },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!item) throw new NotFoundException('Artículo no encontrado');
    return item;
  }

  async update(userId: number, id: number, dto: UpdateItemDto) {
    const companyId = await this.getCompanyIdByUser(userId);

    await this.findOne(userId, id);

    if (dto.categoryId) await this.assertCategoryInCompany(companyId, dto.categoryId);

    const data: any = {};
    if (dto.name) data.name = dto.name.trim();
    if (dto.sku !== undefined) data.sku = dto.sku?.trim() || null;
    if (dto.type) data.type = dto.type as any;
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.basePrice !== undefined) data.basePrice = dto.basePrice ?? null;
    if (dto.categoryId) data.categoryId = dto.categoryId;
    if (typeof dto.isActive === 'boolean') data.isActive = dto.isActive;

    try {
      return await this.prisma.item.update({
        where: { id },
        data,
        include: { category: { select: { id: true, name: true } } },
      });
    } catch {
      throw new BadRequestException('No se pudo actualizar (SKU duplicado?)');
    }
  }

  async remove(userId: number, id: number) {
    const companyId = await this.getCompanyIdByUser(userId);

    await this.findOne(userId, id);

    return this.prisma.item.update({
      where: { id },
      data: { isActive: false },
      include: { category: { select: { id: true, name: true } } },
    });
  }
}

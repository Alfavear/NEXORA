import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  private async assertGroupInCompany(companyId: number, groupId: number) {
    const group = await this.prisma.itemGroup.findFirst({
      where: { id: groupId, companyId },
      select: { id: true },
    });
    if (!group) throw new BadRequestException('groupId inválido');
  }

  private async assertBrandInCompany(companyId: number, brandId: number) {
    const brand = await this.prisma.itemBrand.findFirst({
      where: { id: brandId, companyId },
      select: { id: true },
    });
    if (!brand) throw new BadRequestException('brandId inválido');
  }

  private async assertOwnerInCompany(companyId: number, ownerId: number) {
    const owner = await this.prisma.itemOwner.findFirst({
      where: { id: ownerId, companyId },
      select: { id: true },
    });
    if (!owner) throw new BadRequestException('ownerId inválido');
  }

  private async assertProviderInCompany(companyId: number, providerId: number) {
    const provider = await this.prisma.supplier.findFirst({
      where: { id: providerId, companyId },
      select: { id: true },
    });
    if (!provider) throw new BadRequestException('providerId inválido');
  }

  async create(userId: number, dto: CreateItemDto) {
    const companyId = await this.getCompanyIdByUser(userId);

    await this.assertCategoryInCompany(companyId, dto.categoryId);
    if (dto.groupId) await this.assertGroupInCompany(companyId, dto.groupId);
    if (dto.brandId) await this.assertBrandInCompany(companyId, dto.brandId);
    if (dto.ownerId) await this.assertOwnerInCompany(companyId, dto.ownerId);
    if (dto.providerId)
      await this.assertProviderInCompany(companyId, dto.providerId);

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
          groupId: dto.groupId || null,
          brandId: dto.brandId || null,
          model: dto.model?.trim() ?? null,
          costPrice: dto.costPrice ?? null,
          basePrice: dto.basePrice ?? null,
          salePrice: dto.salePrice ?? null,
          wholesalePrice: dto.wholesalePrice ?? null,
          discountPercent: dto.discountPercent ?? null,
          promotionPercent: dto.promotionPercent ?? null,
          ownerId: dto.ownerId || null,
          providerId: dto.providerId || null,
          observations: dto.observations?.trim() ?? null,
          imageUrl: dto.imageUrl?.trim() || null,
        },
        include: { category: { select: { id: true, name: true } } },
      });
    } catch {
      throw new BadRequestException('No se pudo crear (SKU duplicado?)');
    }
  }

  async findAll(
    userId: number,
    query: {
      q?: string;
      categoryId?: number;
      type?: string;
      isActive?: boolean;
    },
  ) {
    const companyId = await this.getCompanyIdByUser(userId);

    return this.prisma.item.findMany({
      where: {
        companyId,
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.type ? { type: query.type as any } : {}),
        ...(typeof query.isActive === 'boolean'
          ? { isActive: query.isActive }
          : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: 'insensitive' } },
                { sku: { contains: query.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        stocks: { select: { quantity: true } },
      },
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

    if (dto.categoryId)
      await this.assertCategoryInCompany(companyId, dto.categoryId);
    if (dto.groupId) await this.assertGroupInCompany(companyId, dto.groupId);
    if (dto.brandId) await this.assertBrandInCompany(companyId, dto.brandId);
    if (dto.ownerId) await this.assertOwnerInCompany(companyId, dto.ownerId);
    if (dto.providerId)
      await this.assertProviderInCompany(companyId, dto.providerId);

    const data: any = {};
    if (dto.name) data.name = dto.name.trim();
    if (dto.sku !== undefined) data.sku = dto.sku?.trim() || null;
    if (dto.type) data.type = dto.type as any;
    if (dto.description !== undefined)
      data.description = dto.description?.trim() || null;
    if (dto.basePrice !== undefined) data.basePrice = dto.basePrice ?? null;
    if (dto.categoryId) data.categoryId = dto.categoryId;
    if (typeof dto.isActive === 'boolean') data.isActive = dto.isActive;
    if (dto.groupId !== undefined) data.groupId = dto.groupId || null;
    if (dto.brandId !== undefined) data.brandId = dto.brandId || null;
    if (dto.model !== undefined) data.model = dto.model?.trim() || null;
    if (dto.costPrice !== undefined) data.costPrice = dto.costPrice ?? null;
    if (dto.salePrice !== undefined) data.salePrice = dto.salePrice ?? null;
    if (dto.wholesalePrice !== undefined)
      data.wholesalePrice = dto.wholesalePrice ?? null;
    if (dto.discountPercent !== undefined)
      data.discountPercent = dto.discountPercent ?? null;
    if (dto.promotionPercent !== undefined)
      data.promotionPercent = dto.promotionPercent ?? null;
    if (dto.ownerId !== undefined) data.ownerId = dto.ownerId || null;
    if (dto.providerId !== undefined) data.providerId = dto.providerId || null;
    if (dto.observations !== undefined)
      data.observations = dto.observations?.trim() || null;
    if (dto.imageUrl !== undefined)
      data.imageUrl = dto.imageUrl?.trim() || null;

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

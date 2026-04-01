import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemBrandDto } from './dto/create-item-brand.dto';
import { UpdateItemBrandDto } from './dto/update-item-brand.dto';

@Injectable()
export class ItemBrandsService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyIdByUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!user) throw new BadRequestException('Usuario inválido');
    return user.companyId;
  }

  async create(userId: number, dto: CreateItemBrandDto) {
    const companyId = await this.getCompanyIdByUser(userId);
    return this.prisma.itemBrand.create({
      data: {
        companyId,
        name: dto.name.trim(),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(userId: number) {
    const companyId = await this.getCompanyIdByUser(userId);
    return this.prisma.itemBrand.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: number, id: number) {
    const companyId = await this.getCompanyIdByUser(userId);
    const brand = await this.prisma.itemBrand.findFirst({
      where: { id, companyId },
    });
    if (!brand) throw new NotFoundException('Marca no encontrada');
    return brand;
  }

  async update(userId: number, id: number, dto: UpdateItemBrandDto) {
    await this.findOne(userId, id);

    return this.prisma.itemBrand.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        isActive: dto.isActive,
      },
    });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    return this.prisma.itemBrand.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemGroupDto } from './dto/create-item-group.dto';
import { UpdateItemGroupDto } from './dto/update-item-group.dto';

@Injectable()
export class ItemGroupsService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyIdByUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!user) throw new BadRequestException('Usuario inválido');
    return user.companyId;
  }

  async create(userId: number, dto: CreateItemGroupDto) {
    const companyId = await this.getCompanyIdByUser(userId);
    return this.prisma.itemGroup.create({
      data: {
        companyId,
        name: dto.name.trim(),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(userId: number) {
    const companyId = await this.getCompanyIdByUser(userId);
    return this.prisma.itemGroup.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: number, id: number) {
    const companyId = await this.getCompanyIdByUser(userId);
    const group = await this.prisma.itemGroup.findFirst({
      where: { id, companyId },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    return group;
  }

  async update(userId: number, id: number, dto: UpdateItemGroupDto) {
    await this.findOne(userId, id);

    return this.prisma.itemGroup.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        isActive: dto.isActive,
      },
    });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    return this.prisma.itemGroup.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

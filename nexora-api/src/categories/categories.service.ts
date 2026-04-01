import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyIdByUser(userId: number) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!u) throw new BadRequestException('Usuario inválido');
    return u.companyId;
  }

  async create(userId: number, dto: CreateCategoryDto) {
    const companyId = await this.getCompanyIdByUser(userId);

    // unique (companyId, name)
    try {
      return await this.prisma.itemCategory.create({
        data: { name: dto.name.trim(), companyId },
      });
    } catch (e: any) {
      throw new BadRequestException('Ya existe una categoría con ese nombre');
    }
  }

  async findAll(userId: number, isActive?: boolean) {
    const companyId = await this.getCompanyIdByUser(userId);

    return this.prisma.itemCategory.findMany({
      where: {
        companyId,
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: number, id: number) {
    const companyId = await this.getCompanyIdByUser(userId);

    const cat = await this.prisma.itemCategory.findFirst({
      where: { id, companyId },
    });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  async update(userId: number, id: number, dto: UpdateCategoryDto) {
    const companyId = await this.getCompanyIdByUser(userId);

    await this.findOne(userId, id);

    if (dto.name) dto.name = dto.name.trim();

    try {
      return await this.prisma.itemCategory.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(typeof dto.isActive === 'boolean'
            ? { isActive: dto.isActive }
            : {}),
        },
      });
    } catch {
      throw new BadRequestException(
        'No se pudo actualizar (nombre duplicado?)',
      );
    }
  }

  async remove(userId: number, id: number) {
    const companyId = await this.getCompanyIdByUser(userId);

    // asegura pertenencia
    await this.findOne(userId, id);

    // soft delete
    return this.prisma.itemCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

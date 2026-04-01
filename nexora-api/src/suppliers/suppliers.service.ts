import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyIdByUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    if (!user) throw new BadRequestException('Usuario inválido');
    return user.companyId;
  }

  async create(userId: number, dto: CreateSupplierDto) {
    const companyId = await this.getCompanyIdByUser(userId);

    return this.prisma.supplier.create({
      data: {
        name: dto.name.trim(),
        ruc: dto.ruc?.trim(),
        phone: dto.phone?.trim(),
        email: dto.email?.trim().toLowerCase(),
        address: dto.address?.trim(),
        companyId,
      },
    });
  }

  async findAll(userId: number, isActive?: boolean) {
    const companyId = await this.getCompanyIdByUser(userId);

    return this.prisma.supplier.findMany({
      where: {
        companyId,
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: number, id: number) {
    const companyId = await this.getCompanyIdByUser(userId);

    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId },
    });

    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async update(userId: number, id: number, dto: UpdateSupplierDto) {
    const companyId = await this.getCompanyIdByUser(userId);

    // Verificar que existe y pertenece a la empresa
    await this.findOne(userId, id);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name.trim();
    if (dto.ruc !== undefined) updateData.ruc = dto.ruc?.trim();
    if (dto.phone !== undefined) updateData.phone = dto.phone?.trim();
    if (dto.email !== undefined)
      updateData.email = dto.email?.trim().toLowerCase();
    if (dto.address !== undefined) updateData.address = dto.address?.trim();
    if (typeof dto.isActive === 'boolean') updateData.isActive = dto.isActive;

    return this.prisma.supplier.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: number, id: number) {
    // Verificar que existe y pertenece a la empresa
    await this.findOne(userId, id);

    // Soft delete
    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

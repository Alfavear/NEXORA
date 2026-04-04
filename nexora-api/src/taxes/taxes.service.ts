import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Injectable()
export class TaxesService {
  constructor(private prisma: PrismaService) {}

  async getUserContext(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuario inválido');
    return { companyId: user.companyId };
  }

  async create(userId: number, dto: CreateTaxDto) {
    const { companyId } = await this.getUserContext(userId);
    try {
      return await this.prisma.tax.create({
        data: {
          companyId,
          ...dto,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(`El impuesto '${dto.name}' ya existe.`);
      }
      throw new BadRequestException(`Error interno al crear: ${error.message || error}`);
    }
  }

  async findAll(userId: number) {
    const { companyId } = await this.getUserContext(userId);
    return this.prisma.tax.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: number, id: number) {
    const { companyId } = await this.getUserContext(userId);
    const tax = await this.prisma.tax.findFirst({
      where: { id, companyId },
    });
    if (!tax) throw new NotFoundException('Impuesto no encontrado');
    return tax;
  }

  async update(userId: number, id: number, dto: UpdateTaxDto) {
    const { companyId } = await this.getUserContext(userId);
    await this.findOne(userId, id);
    try {
      return await this.prisma.tax.update({
        where: { id },
        data: dto,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(`El impuesto '${dto.name}' ya existe.`);
      }
      throw new BadRequestException(`Error interno al actualizar: ${error.message || error}`);
    }
  }

  async remove(userId: number, id: number) {
    const { companyId } = await this.getUserContext(userId);
    await this.findOne(userId, id);
    return this.prisma.tax.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
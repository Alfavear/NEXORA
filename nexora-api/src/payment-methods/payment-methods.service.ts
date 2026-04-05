import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethod.create({
      data: {
        companyId,
        ...dto,
      },
    });
  }

  async findAll(companyId: number) {
    return this.prisma.paymentMethod.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(companyId: number, id: number) {
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id, companyId },
    });
    if (!paymentMethod) throw new NotFoundException('Método de pago no encontrado');
    return paymentMethod;
  }

  async update(companyId: number, id: number, dto: UpdatePaymentMethodDto) {
    await this.findOne(companyId, id);
    return this.prisma.paymentMethod.update({
      where: { id },
      data: dto,
    });
  }

  async remove(companyId: number, id: number) {
    await this.findOne(companyId, id);
    return this.prisma.paymentMethod.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

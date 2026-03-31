import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

type ReqUser = { sub: number; email: string; role: 'ADMIN' | 'VENDEDOR'; branchId: number };

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  private async getActorCompanyId(actorId: number) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId }, select: { companyId: true } });
    if (!actor) throw new BadRequestException('Actor inválido');
    return actor.companyId;
  }

  async list(actor: ReqUser) {
    const companyId = await this.getActorCompanyId(actor.sub);
    return this.prisma.branch.findMany({ where: { companyId }, orderBy: { id: 'asc' } });
  }

  async create(actor: ReqUser, dto: CreateBranchDto) {
    const companyId = await this.getActorCompanyId(actor.sub);
    return this.prisma.branch.create({ data: { companyId, name: dto.name, address: dto.address, phone: dto.phone } });
  }

  async update(actor: ReqUser, id: number, dto: UpdateBranchDto) {
    const companyId = await this.getActorCompanyId(actor.sub);
    const branch = await this.prisma.branch.findFirst({ where: { id, companyId } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    return this.prisma.branch.update({ where: { id }, data: { ...dto } });
  }

  async remove(actor: ReqUser, id: number) {
    const companyId = await this.getActorCompanyId(actor.sub);
    const branch = await this.prisma.branch.findFirst({ where: { id, companyId } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    const dependentUsers = await this.prisma.userBranch.findFirst({ where: { branchId: id } });
    if (dependentUsers) {
      throw new ForbiddenException('No se puede eliminar la sucursal con usuarios asignados');
    }

    return this.prisma.branch.delete({ where: { id } });
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserBranchesDto } from './dto/update-user-branches.dto';

type ReqUser = {
  sub: number;
  email: string;
  role: 'ADMIN' | 'VENDEDOR';
  branchId: number;
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 🔑 usado por AuthService para login dual
  findByEmailOrUsername(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.trim().toLowerCase() },
          { username: identifier.trim().toLowerCase() },
        ],
      },
      include: { role: true },
    });
  }

  private async getActorCompanyId(actorId: number) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { companyId: true },
    });
    if (!actor) throw new BadRequestException('Actor inválido');
    return actor.companyId;
  }

  async create(dto: CreateUserDto, actor: ReqUser) {
    const companyId = await this.getActorCompanyId(actor.sub);

    // email único
    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });
    if (exists)
      throw new BadRequestException('Ya existe un usuario con ese email o username');

    // validar que la sede pertenezca a la empresa
    const branches = await this.prisma.branch.findMany({
      where: { id: { in: dto.branchIds }, companyId },
      select: { id: true },
    });
    if (branches.length !== dto.branchIds.length) {
      throw new ForbiddenException(
        'Una o más sedes no existen o no pertenecen a tu empresa',
      );
    }

    const assignedRole = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
      select: { id: true },
    });
    if (!assignedRole)
      throw new BadRequestException('El rol asignado no existe');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    
    // Autogenerar username si no viene en el DTO
    const finalUsername = (dto.username || dto.email.split('@')[0]).toLowerCase();

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        username: finalUsername,
        passwordHash,
        isActive: true,
        companyId,
        roleId: assignedRole.id,
        userBranches: {
          create: dto.branchIds.map((branchId) => ({
            branchId,
            isActive: true,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        isActive: true,
        createdAt: true,
        role: { select: { name: true } },
        userBranches: {
          select: {
            branchId: true,
            isActive: true,
            assignedAt: true,
            branch: { select: { name: true } },
          },
        },
      },
    });

    return user;
  }

  async list(actor: ReqUser) {
    const companyId = await this.getActorCompanyId(actor.sub);

    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        role: { select: { name: true } },
        userBranches: {
          select: {
            branchId: true,
            isActive: true,
            assignedAt: true,
            branch: { select: { name: true } },
          },
          orderBy: { branchId: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async updateUser(id: number, dto: UpdateUserDto, actor: ReqUser) {
    const companyId = await this.getActorCompanyId(actor.sub);

    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: { select: { name: true } },
      },
    });
  }

  // Reemplaza lista de sedes: las nuevas quedan activas, las que no estén se desactivan
  async replaceBranches(
    userId: number,
    dto: UpdateUserBranchesDto,
    actor: ReqUser,
  ) {
    const companyId = await this.getActorCompanyId(actor.sub);

    // usuario pertenece a empresa
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // validar sedes de la empresa
    const branches = await this.prisma.branch.findMany({
      where: { id: { in: dto.branchIds }, companyId },
      select: { id: true },
    });
    if (branches.length !== dto.branchIds.length) {
      throw new ForbiddenException(
        'Una o más sedes no existen o no pertenecen a tu empresa',
      );
    }

    // 1) desactivar todas las actuales
    await this.prisma.userBranch.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    // 2) activar o crear las nuevas
    for (const branchId of dto.branchIds) {
      await this.prisma.userBranch.upsert({
        where: { userId_branchId: { userId, branchId } },
        update: { isActive: true },
        create: { userId, branchId, isActive: true },
      });
    }

    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: { select: { name: true } },
        userBranches: {
          select: {
            branchId: true,
            isActive: true,
            assignedAt: true,
            branch: { select: { name: true } },
          },
          orderBy: { branchId: 'asc' },
        },
      },
    });
  }
}

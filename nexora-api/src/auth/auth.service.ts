import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

type JwtUser = {
  sub: number;
  email: string;
  role: 'ADMIN' | 'VENDEDOR';
  branchId: number;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Log de diagnóstico para el comando DB (seguro)
    const dbUrl = process.env.DATABASE_URL || '';
    const dbHost = dbUrl.split('@')[1]?.split('/')[0] || 'unknown';
    console.log(`[AUTH] Intento de login para: ${normalizedEmail} en DB: ${dbHost}`);

    const user = await this.usersService.findByEmail(normalizedEmail);
    
    if (!user) {
      console.log(`[AUTH] ERROR: Usuario no encontrado (${normalizedEmail})`);
      throw new UnauthorizedException('EMAIL_NOT_FOUND');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log(`[AUTH] ERROR: Contraseña incorrecta para ${normalizedEmail}`);
      throw new UnauthorizedException('PASSWORD_WRONG');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('USER_INACTIVE');
    }

    return user;
  }

  private async assertBranchAccess(userId: number, branchId: number) {
    const access = await this.prisma.userBranch.findUnique({
      where: { userId_branchId: { userId, branchId } },
      select: { isActive: true, branch: { select: { id: true, name: true } } },
    });

    if (!access || !access.isActive) {
      throw new ForbiddenException('No tienes acceso a esa sede');
    }

    return access.branch; // { id, name }
  }

  async login(email: string, password: string, branchId?: number) {
    const user = await this.validateUser(email, password);
    const roleName = user.role.name as JwtUser['role'];

    // VENDEDOR: branchId opcional en login (Opción A).
    if (roleName === 'VENDEDOR') {
      let effectiveBranchId: number;

      if (branchId) {
        await this.assertBranchAccess(user.id, branchId);
        effectiveBranchId = branchId;
      } else {
        const first = await this.prisma.userBranch.findFirst({
          where: { userId: user.id, isActive: true },
          select: { branchId: true },
          orderBy: { assignedAt: 'asc' },
        });

        if (!first)
          throw new ForbiddenException('Vendedor sin sedes asignadas');
        effectiveBranchId = first.branchId; // sede temporal
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: roleName,
        branchId: effectiveBranchId,
      };

      return { access_token: this.jwtService.sign(payload) };
    }

    // ADMIN: branchId opcional
    let effectiveBranchId: number;

    if (branchId) {
      await this.assertBranchAccess(user.id, branchId);
      effectiveBranchId = branchId;
    } else {
      const first = await this.prisma.userBranch.findFirst({
        where: { userId: user.id, isActive: true },
        select: { branchId: true },
        orderBy: { assignedAt: 'asc' },
      });

      if (!first) throw new ForbiddenException('Admin sin sedes asignadas');
      effectiveBranchId = first.branchId;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: roleName,
      branchId: effectiveBranchId,
    };

    return { access_token: this.jwtService.sign(payload) };
  }

  // ✅ 1) /auth/me enriquecido
  async meEnriched(jwtUser: JwtUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: jwtUser.sub },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true,
        role: { select: { name: true } },
        userBranches: {
          where: { isActive: true },
          select: { branchId: true, branch: { select: { name: true } } },
          orderBy: { branchId: 'asc' },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Usuario inválido');

    // validar que la sede activa del token siga siendo válida
    const activeBranch = await this.prisma.branch.findUnique({
      where: { id: jwtUser.branchId },
      select: { id: true, name: true },
    });

    const branches = user.userBranches.map((ub) => ({
      branchId: ub.branchId,
      name: ub.branch.name,
    }));

    const branchName =
      branches.find((b) => b.branchId === jwtUser.branchId)?.name ??
      activeBranch?.name ??
      null;

    return {
      sub: jwtUser.sub,
      email: jwtUser.email,
      role: jwtUser.role,
      branchId: jwtUser.branchId,
      name: user.name,
      companyId: user.companyId,
      branchName,
      branches,
    };
  }

  // ✅ 3) /auth/switch-branch -> nuevo token
  async switchBranch(jwtUser: JwtUser, branchId: number) {
    // valida acceso (ADMIN o VENDEDOR)
    await this.assertBranchAccess(jwtUser.sub, branchId);

    const payload = {
      sub: jwtUser.sub,
      email: jwtUser.email,
      role: jwtUser.role,
      branchId,
    };

    return { access_token: this.jwtService.sign(payload) };
  }
}

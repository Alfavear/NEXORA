import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users/me')
export class UsersMeController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get('branches')
  async myBranches(@Request() req: any) {
    const userId = req.user.sub;

    const branches = await this.prisma.userBranch.findMany({
      where: { userId, isActive: true },
      select: {
        branchId: true,
        branch: { select: { name: true } },
      },
      orderBy: { branchId: 'asc' },
    });

    return branches.map((b) => ({
      branchId: b.branchId,
      name: b.branch.name,
    }));
  }
}

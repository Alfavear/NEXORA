import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { LoginDto } from './dto/login.dto';
import { SwitchBranchDto } from './dto/switch-branch.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password, dto.branchId);
  }

  // ✅ 1) ME enriquecido
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.authService.meEnriched(req.user);
  }

  // ✅ 3) Cambiar sede activa (nuevo token)
  @UseGuards(JwtAuthGuard)
  @Post('switch-branch')
  switchBranch(@Body() dto: SwitchBranchDto, @Request() req: any) {
    return this.authService.switchBranch(req.user, dto.branchId);
  }

  // ✅ Solo ADMIN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin-only')
  adminOnly(@Request() req: any) {
    return { ok: true, user: req.user };
  }
}

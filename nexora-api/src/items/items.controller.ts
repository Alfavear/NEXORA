import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemsController {
  constructor(private service: ItemsService) {}

  // ADMIN crea
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Request() req: any, @Body() dto: CreateItemDto) {
    return this.service.create(req.user.sub, dto);
  }

  // ADMIN upload imagen
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'items');
          if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const name = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '-');
          cb(null, name);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif/;
        const ext = file.mimetype.split('/')[1];
        cb(null, allowed.test(ext));
      },
    }),
  )
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No se subió ningún archivo');
    }
    const host = process.env.FRONTEND_URL || 'http://localhost:3000';
    const backend = process.env.BACKEND_URL || 'http://localhost:10000';
    const url = `${backend}/uploads/items/${file.filename}`;
    return { imageUrl: url };
  }

  // ADMIN/VENDEDOR leen con filtros
  @Get()
  findAll(
    @Request() req: any,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.findAll(req.user.sub, {
      q: q?.trim() || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      type: type || undefined,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.sub, Number(id));
  }

  // ADMIN actualiza
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.service.update(req.user.sub, Number(id), dto);
  }

  // ADMIN elimina (soft)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.sub, Number(id));
  }
}

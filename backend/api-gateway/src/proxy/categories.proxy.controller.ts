import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@ApiBearerAuth('access-token')
@Controller('categories')
export class CategoriesProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Post()
  @ApiOperation({ summary: 'Crear categoría' })
  @ApiBody({ type: CreateCategoryDto })
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('PRODUCTS', '/categories', req, res);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías' })
  findAll(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('PRODUCTS', '/categories', req, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener categoría por id' })
  @ApiParam({ name: 'id', description: 'UUID de la categoría' })
  findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('PRODUCTS', `/categories/${id}`, req, res);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiParam({ name: 'id', description: 'UUID de la categoría' })
  @ApiBody({ type: UpdateCategoryDto })
  update(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('PRODUCTS', `/categories/${id}`, req, res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría' })
  @ApiParam({ name: 'id', description: 'UUID de la categoría' })
  remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('PRODUCTS', `/categories/${id}`, req, res);
  }
}
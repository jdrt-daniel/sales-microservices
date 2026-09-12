import { Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@ApiTags('products')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductsProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  @ApiBody({ type: CreateProductDto })
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('PRODUCTS', '/products', req, res);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  findAll(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('PRODUCTS', '/products', req, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por id' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('PRODUCTS', `/products/${id}`, req, res);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiBody({ type: UpdateProductDto })
  update(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('PRODUCTS', `/products/${id}`, req, res);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Ajustar stock (negativo = venta, positivo = ingreso)' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiBody({ type: AdjustStockDto })
  adjustStock(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('PRODUCTS', `/products/${id}/stock`, req, res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('PRODUCTS', `/products/${id}`, req, res);
  }
}
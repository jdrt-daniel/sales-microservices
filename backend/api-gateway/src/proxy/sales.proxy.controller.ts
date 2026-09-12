import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@ApiTags('sales')
@ApiBearerAuth('access-token')
@Controller('sales')
export class SalesProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar venta (descuenta stock via gRPC a ms-products)' })
  @ApiBody({ type: CreateSaleDto })
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('SALES', '/sales', req, res);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ventas' })
  findAll(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('SALES', '/sales', req, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta por id' })
  @ApiParam({ name: 'id', description: 'UUID de la venta' })
  findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('SALES', `/sales/${id}`, req, res);
  }
}
import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@ApiTags('purchases')
@ApiBearerAuth('access-token')
@Controller('purchases')
export class PurchasesProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar compra (suma stock via gRPC a ms-products)' })
  @ApiBody({ type: CreatePurchaseDto })
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('SALES', '/purchases', req, res);
  }

  @Get()
  @ApiOperation({ summary: 'Listar compras' })
  findAll(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('SALES', '/purchases', req, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener compra por id' })
  @ApiParam({ name: 'id', description: 'UUID de la compra' })
  findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('SALES', `/purchases/${id}`, req, res);
  }
}
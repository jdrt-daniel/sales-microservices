import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('clients')
@ApiBearerAuth('access-token')
@Controller('clients')
export class ClientsProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Post()
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiBody({ type: CreateClientDto })
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', '/clients', req, res);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  findAll(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', '/clients', req, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por id' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/clients/${id}`, req, res);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiBody({ type: UpdateClientDto })
  update(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/clients/${id}`, req, res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/clients/${id}`, req, res);
  }
}
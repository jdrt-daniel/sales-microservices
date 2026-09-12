import { Controller, Delete, Get, Param, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { CreatePermissionDto } from './dto/create-permission.dto';

@ApiTags('permissions')
@ApiBearerAuth('access-token')
@Controller('permissions')
export class PermissionsProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Post()
  @ApiOperation({ summary: 'Crear permiso' })
  @ApiBody({ type: CreatePermissionDto })
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', '/permissions', req, res);
  }

  @Get()
  @ApiOperation({ summary: 'Listar permisos' })
  findAll(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', '/permissions', req, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener permiso por id' })
  @ApiParam({ name: 'id', description: 'UUID del permiso' })
  findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/permissions/${id}`, req, res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar permiso' })
  @ApiParam({ name: 'id', description: 'UUID del permiso' })
  remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/permissions/${id}`, req, res);
  }
}
import { Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Post()
  @ApiOperation({ summary: 'Crear rol' })
  @ApiBody({ type: CreateRoleDto })
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', '/roles', req, res);
  }

  @Get()
  @ApiOperation({ summary: 'Listar roles' })
  findAll(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', '/roles', req, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener rol por id' })
  @ApiParam({ name: 'id', description: 'UUID del rol' })
  findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/roles/${id}`, req, res);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar rol' })
  @ApiParam({ name: 'id', description: 'UUID del rol' })
  @ApiBody({ type: UpdateRoleDto })
  update(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/roles/${id}`, req, res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar rol' })
  @ApiParam({ name: 'id', description: 'UUID del rol' })
  remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/roles/${id}`, req, res);
  }
}
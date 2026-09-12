import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiBody({ type: CreateUserDto })
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', '/users', req, res);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  findAll(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', '/users', req, res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por id' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/users/${id}`, req, res);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiBody({ type: UpdateUserDto })
  update(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/users/${id}`, req, res);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Cambiar contraseña del usuario' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiBody({ type: ChangePasswordDto })
  changePassword(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/users/${id}/password`, req, res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('USERS', `/users/${id}`, req, res);
  }
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del rol', example: 'vendedor' })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Descripción', example: 'Ventas y lectura de productos' })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({ description: 'IDs de permisos', type: [String], example: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'] })
  permissionIds?: string[];
}
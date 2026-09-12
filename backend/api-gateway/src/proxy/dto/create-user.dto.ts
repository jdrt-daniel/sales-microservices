import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty({ description: 'Email del usuario', example: 'ana@demo.com' })
  email!: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ description: 'Contraseña (mínimo 8 caracteres)', example: 'Password123!' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre completo', example: 'Ana Pérez' })
  fullName!: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Estado activo', default: true })
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiPropertyOptional({ description: 'IDs de roles a asignar', type: [String], example: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'] })
  roleIds?: string[];
}
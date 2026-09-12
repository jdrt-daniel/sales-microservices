import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Número de documento', example: '12345678' })
  documentNumber!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre completo', example: 'Juan Pérez' })
  fullName!: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ description: 'Email', example: 'juan@mail.com' })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Teléfono', example: '999111222' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Dirección', example: 'Av. Lima 123' })
  address?: string;
}
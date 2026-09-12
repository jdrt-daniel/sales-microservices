import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'SKU único del producto', example: 'BEB-001' })
  sku!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del producto', example: 'Coca-Cola 500ml' })
  name!: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: 'Precio', example: 8.5 })
  price!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Stock inicial', default: 0 })
  stock?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Estado activo', default: true })
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'ID de la categoría', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  categoryId?: string;
}
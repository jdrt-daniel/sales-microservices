import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre de la categoría', example: 'Bebidas' })
  name!: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'ID de la categoría padre (para anidar)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  parentId?: string;
}
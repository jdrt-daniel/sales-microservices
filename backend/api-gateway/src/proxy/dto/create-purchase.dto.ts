import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class PurchaseItemInput {
  @IsUUID()
  @ApiProperty({ description: 'ID del producto', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  productId!: string;

  @IsInt()
  @IsPositive()
  @ApiProperty({ description: 'Cantidad', example: 50 })
  quantity!: number;

  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: 'Costo unitario', example: 4.0 })
  unitCost!: number;
}

export class CreatePurchaseDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'ID del proveedor', example: '8a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a11' })
  supplierId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemInput)
  @ApiProperty({ description: 'Líneas de la compra', type: [PurchaseItemInput] })
  items!: PurchaseItemInput[];
}
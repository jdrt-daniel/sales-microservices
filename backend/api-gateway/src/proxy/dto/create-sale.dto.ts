import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class SaleItemInput {
  @IsUUID()
  @ApiProperty({ description: 'ID del producto', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  productId!: string;

  @IsInt()
  @IsPositive()
  @ApiProperty({ description: 'Cantidad', example: 2 })
  quantity!: number;
}

export class CreateSaleDto {
  @IsUUID()
  @ApiProperty({ description: 'ID del cliente (se valida via gRPC contra ms-users)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  clientId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemInput)
  @ApiProperty({ description: 'Líneas de la venta', type: [SaleItemInput] })
  items!: SaleItemInput[];
}
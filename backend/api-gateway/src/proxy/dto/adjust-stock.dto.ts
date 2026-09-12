import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

// quantity puede ser negativo (venta) o positivo (compra/reingreso de stock)
export class AdjustStockDto {
  @IsInt()
  @ApiProperty({ description: 'Cantidad a sumar o restar al stock (negativa = venta)', example: -2 })
  quantity!: number;
}
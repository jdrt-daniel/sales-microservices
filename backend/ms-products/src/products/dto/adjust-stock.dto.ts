import { IsInt } from 'class-validator';

// quantity puede ser negativo (venta) o positivo (compra/reingreso de stock)
export class AdjustStockDto {
  @IsInt()
  quantity: number;
}

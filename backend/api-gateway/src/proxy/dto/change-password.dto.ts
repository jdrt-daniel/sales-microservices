import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @ApiProperty({ description: 'Nueva contraseña (mínimo 8 caracteres)', example: 'NuevaPass123!' })
  newPassword!: string;
}
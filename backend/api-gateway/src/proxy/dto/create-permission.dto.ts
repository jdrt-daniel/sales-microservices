import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre del permiso', example: 'sales.create' })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Recurso al que aplica', example: 'sales' })
  resource!: string;
}
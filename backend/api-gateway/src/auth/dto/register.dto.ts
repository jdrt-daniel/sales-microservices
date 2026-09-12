import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @ApiProperty({ description: 'Email del usuario', example: 'admin@demo.com' })
  email!: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ description: 'Contraseña del usuario (mínimo 8 caracteres)', example: 'Password123!' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Ana Pérez' })
  fullName!: string;
}
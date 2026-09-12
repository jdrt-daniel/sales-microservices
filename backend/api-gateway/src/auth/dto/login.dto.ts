import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @ApiProperty({ description: 'Email del usuario', example: 'admin@demo.com' })
  email!: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ description: 'Contraseña del usuario', example: 'Password123!' })
  password!: string;
}

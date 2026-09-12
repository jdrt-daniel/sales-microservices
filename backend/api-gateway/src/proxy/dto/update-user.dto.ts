import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// La contraseña se cambia por un endpoint aparte (PATCH /users/:id/password)
export class UpdateUserDto extends PartialType(CreateUserDto) {}
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly usersUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.usersUrl = this.config.get<string>('MS_USERS_URL', 'http://localhost:3001');
  }

  async login(dto: LoginDto) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.usersUrl}/auth/login`, dto),
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Credenciales inválidas');
      }
      this.logger.error(`Error en login: ${error.message}`);
      throw new UnauthorizedException('Error al autenticar');
    }
  }

  async register(dto: RegisterDto) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.usersUrl}/auth/register`, dto),
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        throw error.response.data;
      }
      this.logger.error(`Error en register: ${error.message}`);
      throw error;
    }
  }
}

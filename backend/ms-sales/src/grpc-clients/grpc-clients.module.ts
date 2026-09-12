import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

export const PRODUCTS_PACKAGE = 'PRODUCTS_PACKAGE';
export const USERS_PACKAGE = 'USERS_PACKAGE';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: PRODUCTS_PACKAGE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'products',
            protoPath: join(process.cwd(), 'proto/products.proto'),
            url: config.get<string>('PRODUCTS_GRPC_URL', 'localhost:5002'),
          },
        }),
      },
      {
        name: USERS_PACKAGE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'users',
            protoPath: join(process.cwd(), 'proto/users.proto'),
            url: config.get<string>('USERS_GRPC_URL', 'localhost:5001'),
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class GrpcClientsModule {}

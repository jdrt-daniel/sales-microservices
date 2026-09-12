import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ProxyService } from './proxy.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { UsersProxyController } from './users.proxy.controller';
import { RolesProxyController } from './roles.proxy.controller';
import { PermissionsProxyController } from './permissions.proxy.controller';
import { ClientsProxyController } from './clients.proxy.controller';
import { ProductsProxyController } from './products.proxy.controller';
import { CategoriesProxyController } from './categories.proxy.controller';
import { SalesProxyController } from './sales.proxy.controller';
import { PurchasesProxyController } from './purchases.proxy.controller';

@Module({
  imports: [
    HttpModule.register({
      maxRedirects: 3,
    }),
    ConfigModule,
  ],
  controllers: [
    UsersProxyController,
    RolesProxyController,
    PermissionsProxyController,
    ClientsProxyController,
    ProductsProxyController,
    CategoriesProxyController,
    SalesProxyController,
    PurchasesProxyController,
  ],
  providers: [ProxyService, CircuitBreakerService],
  exports: [ProxyService, CircuitBreakerService],
})
export class ProxyModule {}
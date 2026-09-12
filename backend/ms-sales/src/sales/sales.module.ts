import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem]),
    GrpcClientsModule,
    KafkaModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}

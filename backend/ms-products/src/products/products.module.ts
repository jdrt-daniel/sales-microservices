import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsGrpcController } from './products.grpc.controller';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), KafkaModule],
  controllers: [ProductsController, ProductsGrpcController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

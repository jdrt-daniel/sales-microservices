import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { ClientsGrpcController } from './clients.grpc.controller';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [TypeOrmModule.forFeature([Client]), KafkaModule],
  controllers: [ClientsController, ClientsGrpcController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}

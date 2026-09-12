import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { clientsCreatedTotal } from '../metrics/business-metrics';

const TOPIC = 'client-events';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    private readonly kafka: KafkaProducerService,
  ) {}

  async create(dto: CreateClientDto): Promise<Client> {
    const client = await this.clientRepo.save(this.clientRepo.create(dto));

    clientsCreatedTotal.inc();

    await this.kafka.emit(TOPIC, client.id, {
      type: 'client.created',
      payload: { id: client.id, fullName: client.fullName },
    });

    return client;
  }

  findAll(): Promise<Client[]> {
    return this.clientRepo.find();
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepo.findOne({ where: { id } });
    if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`);
    return client;
  }

  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, dto);
    const saved = await this.clientRepo.save(client);

    await this.kafka.emit(TOPIC, saved.id, {
      type: 'client.updated',
      payload: { id: saved.id, fullName: saved.fullName },
    });

    return saved;
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepo.remove(client);
  }
}

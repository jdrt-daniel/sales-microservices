import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly config: ConfigService) {
    this.kafka = new Kafka({
      clientId: this.config.get<string>('KAFKA_CLIENT_ID', 'ms-products'),
      brokers: [this.config.get<string>('KAFKA_BROKER', 'localhost:9094')],
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Conectado a Kafka');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  // topic ej: "product-events" | key ej: producto.id | event ej: { type: 'product.created', payload }
  async emit(topic: string, key: string, event: Record<string, unknown>) {
    try {
      await this.producer.send({
        topic,
        messages: [{ key, value: JSON.stringify(event) }],
      });
    } catch (err) {
      // No tumbamos la request HTTP si Kafka falla: solo lo logueamos.
      // (En un caso real, esto se resolvería con el patrón Outbox).
      this.logger.error(`Error publicando evento en ${topic}: ${err.message}`);
    }
  }
}

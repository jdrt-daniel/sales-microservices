import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Purchase, PurchaseStatus } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PRODUCTS_PACKAGE } from '../grpc-clients/grpc-clients.module';
import { ProductsGrpcService } from '../grpc-clients/products-grpc.interface';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { purchasesCreatedTotal } from '../metrics/business-metrics';

const TOPIC = 'purchase-events';

@Injectable()
export class PurchasesService implements OnModuleInit {
  private productsGrpc: ProductsGrpcService;

  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,
    @Inject(PRODUCTS_PACKAGE) private readonly productsClient: ClientGrpc,
    private readonly kafka: KafkaProducerService,
  ) {}

  onModuleInit() {
    this.productsGrpc =
      this.productsClient.getService<ProductsGrpcService>('ProductsGrpcService');
  }

  async create(dto: CreatePurchaseDto): Promise<Purchase> {
    const items: PurchaseItem[] = [];
    let total = 0;

    // Confirmamos que cada producto existe antes de registrar la compra
    for (const line of dto.items) {
      const product = await firstValueFrom(
        this.productsGrpc.getProduct({ id: line.productId }),
      );
      if (!product.found) {
        throw new NotFoundException(`Producto ${line.productId} no existe`);
      }

      const item = new PurchaseItem();
      item.productId = product.id;
      item.productName = product.name;
      item.quantity = line.quantity;
      item.unitCost = line.unitCost;
      items.push(item);

      total += line.unitCost * line.quantity;
    }

    // Reponemos stock en ms-products vía gRPC (cantidad positiva)
    for (const item of items) {
      await firstValueFrom(
        this.productsGrpc.adjustStock({ id: item.productId, quantity: item.quantity }),
      );
    }

    const purchase = this.purchaseRepo.create({
      supplierId: dto.supplierId,
      items,
      total,
      status: PurchaseStatus.COMPLETED,
    });
    const saved = await this.purchaseRepo.save(purchase);

    purchasesCreatedTotal.inc();

    await this.kafka.emit(TOPIC, saved.id, {
      type: 'purchase.completed',
      payload: { id: saved.id, total: saved.total },
    });

    return saved;
  }

  findAll(): Promise<Purchase[]> {
    return this.purchaseRepo.find({ relations: ['items'] });
  }

  async findOne(id: string): Promise<Purchase> {
    const purchase = await this.purchaseRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!purchase) throw new NotFoundException(`Compra ${id} no encontrada`);
    return purchase;
  }
}

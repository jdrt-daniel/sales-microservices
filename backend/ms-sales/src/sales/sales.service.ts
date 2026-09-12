import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import {
  PRODUCTS_PACKAGE,
  USERS_PACKAGE,
} from '../grpc-clients/grpc-clients.module';
import { ProductsGrpcService } from '../grpc-clients/products-grpc.interface';
import { UsersGrpcService } from '../grpc-clients/users-grpc.interface';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { salesCreatedTotal } from '../metrics/business-metrics';

const TOPIC = 'sale-events';

@Injectable()
export class SalesService implements OnModuleInit {
  private productsGrpc: ProductsGrpcService;
  private usersGrpc: UsersGrpcService;

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @Inject(PRODUCTS_PACKAGE) private readonly productsClient: ClientGrpc,
    @Inject(USERS_PACKAGE) private readonly usersClient: ClientGrpc,
    private readonly kafka: KafkaProducerService,
  ) {}

  onModuleInit() {
    this.productsGrpc =
      this.productsClient.getService<ProductsGrpcService>('ProductsGrpcService');
    this.usersGrpc = this.usersClient.getService<UsersGrpcService>('UsersGrpcService');
  }

  async create(dto: CreateSaleDto): Promise<Sale> {
    // 1) Validar cliente vía gRPC contra ms-users
    const client = await firstValueFrom(
      this.usersGrpc.validateClient({ id: dto.clientId }),
    );
    if (!client.exists) {
      throw new NotFoundException(`Cliente ${dto.clientId} no existe`);
    }

    // 2) Validar stock y obtener precio actual de cada producto vía gRPC contra ms-products
    const items: SaleItem[] = [];
    let total = 0;

    for (const line of dto.items) {
      const product = await firstValueFrom(
        this.productsGrpc.getProduct({ id: line.productId }),
      );

      if (!product.found) {
        throw new NotFoundException(`Producto ${line.productId} no existe`);
      }
      if (product.stock < line.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}" (disponible: ${product.stock})`,
        );
      }

      const item = new SaleItem();
      item.productId = product.id;
      item.productName = product.name;
      item.quantity = line.quantity;
      item.unitPrice = product.price;
      items.push(item);

      total += product.price * line.quantity;
    }

    // 3) Todo validado: descontar stock en ms-products vía gRPC (uno por línea)
    //    Nota: si una línea falla a mitad de camino, las anteriores ya quedaron
    //    descontadas. Para un caso real esto se resolvería con un patrón Saga
    //    con compensación (revertir lo ya descontado). Lo dejamos señalado aquí
    //    como siguiente mejora.
    for (const item of items) {
      await firstValueFrom(
        this.productsGrpc.adjustStock({
          id: item.productId,
          quantity: -item.quantity,
        }),
      );
    }

    // 4) Persistir la venta ya confirmada
    const sale = this.saleRepo.create({
      clientId: dto.clientId,
      items,
      total,
      status: SaleStatus.COMPLETED,
    });
    const saved = await this.saleRepo.save(sale);

    salesCreatedTotal.inc();

    await this.kafka.emit(TOPIC, saved.id, {
      type: 'sale.completed',
      payload: { id: saved.id, clientId: saved.clientId, total: saved.total },
    });

    return saved;
  }

  findAll(): Promise<Sale[]> {
    return this.saleRepo.find({ relations: ['items'] });
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.saleRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!sale) throw new NotFoundException(`Venta ${id} no encontrada`);
    return sale;
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import {
  productsCreatedTotal,
  stockAdjustmentsTotal,
} from '../metrics/business-metrics';

const TOPIC = 'product-events';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly kafka: KafkaProducerService,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create({
      ...dto,
      category: dto.categoryId ? ({ id: dto.categoryId } as any) : undefined,
    });
    const saved = await this.productRepo.save(product);

    productsCreatedTotal.inc();

    await this.kafka.emit(TOPIC, saved.id, {
      type: 'product.created',
      payload: { id: saved.id, name: saved.name, price: saved.price },
    });

    return saved;
  }

  findAll(): Promise<Product[]> {
    return this.productRepo.find({ relations: ['category'] });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, {
      ...dto,
      category: dto.categoryId ? ({ id: dto.categoryId } as any) : product.category,
    });
    const saved = await this.productRepo.save(product);

    await this.kafka.emit(TOPIC, saved.id, {
      type: 'product.updated',
      payload: { id: saved.id, name: saved.name, price: saved.price },
    });

    return saved;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepo.remove(product);
  }

  // Usado por ms-sales (vía Kafka o gRPC) para descontar/reponer stock
  async adjustStock(id: string, dto: AdjustStockDto): Promise<Product> {
    const product = await this.findOne(id);
    const newStock = product.stock + dto.quantity;

    if (newStock < 0) {
      throw new BadRequestException(
        `Stock insuficiente para el producto ${product.name} (disponible: ${product.stock})`,
      );
    }

    product.stock = newStock;
    const saved = await this.productRepo.save(product);

    stockAdjustmentsTotal.inc({ type: dto.quantity < 0 ? 'sale' : 'purchase' });

    await this.kafka.emit(TOPIC, saved.id, {
      type: 'product.stock_changed',
      payload: { id: saved.id, stock: saved.stock, change: dto.quantity },
    });

    return saved;
  }
}

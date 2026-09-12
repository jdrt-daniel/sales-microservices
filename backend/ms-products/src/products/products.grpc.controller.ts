import { Controller, NotFoundException, BadRequestException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { ProductsService } from './products.service';

@Controller()
export class ProductsGrpcController {
  constructor(private readonly productsService: ProductsService) {}

  @GrpcMethod('ProductsGrpcService', 'GetProduct')
  async getProduct(data: { id: string }) {
    try {
      const product = await this.productsService.findOne(data.id);
      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        stock: product.stock,
        found: true,
      };
    } catch {
      return { id: data.id, name: '', price: 0, stock: 0, found: false };
    }
  }

  @GrpcMethod('ProductsGrpcService', 'CheckStock')
  async checkStock(data: { id: string; quantity: number }) {
    try {
      const product = await this.productsService.findOne(data.id);
      return {
        available: product.stock >= data.quantity,
        currentStock: product.stock,
      };
    } catch {
      return { available: false, currentStock: 0 };
    }
  }

  @GrpcMethod('ProductsGrpcService', 'AdjustStock')
  async adjustStock(data: { id: string; quantity: number }) {
    try {
      const product = await this.productsService.adjustStock(data.id, {
        quantity: data.quantity,
      });
      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        stock: product.stock,
        found: true,
      };
    } catch (err) {
      // RpcException se traduce en un error gRPC que el cliente (ms-sales) puede capturar
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw new RpcException(err.message);
      }
      throw new RpcException('Error ajustando stock');
    }
  }
}

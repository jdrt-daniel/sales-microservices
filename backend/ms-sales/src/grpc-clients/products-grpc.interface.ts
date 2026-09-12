import { Observable } from 'rxjs';

export interface ProductResponse {
  id: string;
  name: string;
  price: number;
  stock: number;
  found: boolean;
}

export interface ProductsGrpcService {
  getProduct(data: { id: string }): Observable<ProductResponse>;
  checkStock(data: { id: string; quantity: number }): Observable<{
    available: boolean;
    currentStock: number;
  }>;
  adjustStock(data: { id: string; quantity: number }): Observable<ProductResponse>;
}

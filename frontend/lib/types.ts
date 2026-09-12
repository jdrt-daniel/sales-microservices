export interface User {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  roles: Role[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
}

export interface Client {
  id: string;
  documentNumber: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  category?: Category;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  parent?: Category;
  children?: Category[];
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Sale {
  id: string;
  clientId: string;
  total: number;
  status: SaleStatus;
  items: SaleItem[];
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export type PurchaseStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Purchase {
  id: string;
  supplierId?: string;
  total: number;
  status: PurchaseStatus;
  items: PurchaseItem[];
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
}

export interface HealthStatus {
  status: string;
  infected?: string[];
}

export interface GatewayHealth {
  [service: string]: StatusInfo;
}

interface StatusInfo {
  status: string;
  timestamp?: string;
}
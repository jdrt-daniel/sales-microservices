import { Counter } from 'prom-client';

export const productsCreatedTotal = new Counter({
  name: 'products_created_total',
  help: 'Productos creados exitosamente',
});

export const categoriesCreatedTotal = new Counter({
  name: 'categories_created_total',
  help: 'Categorías creadas exitosamente',
});

export const stockAdjustmentsTotal = new Counter({
  name: 'stock_adjustments_total',
  help: 'Ajustes de stock aplicados por tipo (sale/purchase)',
  labelNames: ['type'],
});
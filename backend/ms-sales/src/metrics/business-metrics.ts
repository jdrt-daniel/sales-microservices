import { Counter } from 'prom-client';

export const salesCreatedTotal = new Counter({
  name: 'sales_created_total',
  help: 'Ventas completadas exitosamente',
});

export const purchasesCreatedTotal = new Counter({
  name: 'purchases_created_total',
  help: 'Compras completadas exitosamente',
});
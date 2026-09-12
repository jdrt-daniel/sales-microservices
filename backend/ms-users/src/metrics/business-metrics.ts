import { Counter } from 'prom-client';

export const usersCreatedTotal = new Counter({
  name: 'users_created_total',
  help: 'Usuarios creados exitosamente',
});

export const clientsCreatedTotal = new Counter({
  name: 'clients_created_total',
  help: 'Clientes creados exitosamente',
});
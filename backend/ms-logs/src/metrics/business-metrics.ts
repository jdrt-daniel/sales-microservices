import { Counter } from 'prom-client';

export const logsReceivedTotal = new Counter({
  name: 'logs_received_total',
  help: 'Logs de acceso recibidos desde el gateway',
});

export const logsPersistedTotal = new Counter({
  name: 'logs_persisted_total',
  help: 'Logs persistidos en Postgres',
});

export const logsLokiPushFailuresTotal = new Counter({
  name: 'logs_loki_push_failures_total',
  help: 'Fallos al enviar logs a Loki',
});
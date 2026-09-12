const moneyFormatter = new Intl.NumberFormat('es', {
  style: 'currency',
  currency: 'USD',
});

export function formatMoney(value: number | string): string {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return moneyFormatter.format(numeric);
}

const dateFormatter = new Intl.DateTimeFormat('es', {
  dateStyle: 'short',
});

const dateTimeFormatter = new Intl.DateTimeFormat('es', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

export function statusBadgeColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'green' as const;
    case 'PENDING':
      return 'yellow' as const;
    case 'CANCELLED':
      return 'red' as const;
    default:
      return 'gray' as const;
  }
}

export const statusLabels: Record<string, string> = {
  COMPLETED: 'Completada',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelada',
};
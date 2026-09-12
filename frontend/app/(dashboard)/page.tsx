'use client';

import { api } from '@/lib/api';
import { useAsyncData } from '@/lib/use-async-data';
import { useAuth } from '@/components/auth-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/button';

const SERVICE_LABELS: Record<string, string> = {
  gateway: 'API Gateway',
  users: 'Servicio de Usuarios',
  products: 'Servicio de Productos',
  sales: 'Servicio de Ventas',
  logs: 'Servicio de Logs',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: health, loading, error, reload } = useAsyncData(async () =>
    api<Record<string, any>>('/health'),
  );

  const loadHealth = () => reload({ showLoading: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Hola, {user?.fullName?.split(' ')[0] ?? 'usuario'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Panel de administración del e-commerce
        </p>
      </div>

      <Card
        title="Estado de los servicios"
        description="Check de salud del api-gateway y sus microservicios"
        actions={
          <Button size="sm" variant="secondary" onClick={() => void loadHealth()}>
            Refrescar
          </Button>
        }
      >
        {loading && (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {error && <Alert kind="error">{error}</Alert>}
        {!loading && health && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {Object.entries(health.details).map(([service, statusObj]: any) => (
              <div
                key={service}
                className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-100 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {SERVICE_LABELS[service] ?? service}
                  </p>
                </div>
                <Badge color={statusObj.status === 'up' ? 'green' : 'red'}>
                  {statusObj.status === 'up' ? 'En línea' : 'Caído'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Usuarios', href: '/users', description: 'Gestionar usuarios y roles' },
          { label: 'Productos', href: '/products', description: 'Catálogo, stock y precios' },
          { label: 'Ventas', href: '/sales', description: 'Registrar y ver ventas' },
          { label: 'Compras', href: '/purchases', description: 'Registrar y ver compras' },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600">
              {item.label}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
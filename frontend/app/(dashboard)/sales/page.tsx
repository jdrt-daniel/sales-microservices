'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/lib/use-async-data';
import type { Client, Product, Sale } from '@/lib/types';
import { formatDateTime, formatMoney, statusBadgeColor, statusLabels } from '@/lib/format';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

interface SaleItemForm {
  productId: string;
  quantity: string;
}

export default function SalesPage() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [salesData, clientsData, productsData] = await Promise.all([
      api<Sale[]>(`/sales`),
      api<Client[]>(`/clients`),
      api<Product[]>(`/products`),
    ]);
    return { sales: salesData, clients: clientsData, products: productsData };
  });
  const sales = data?.sales ?? [];
  const clients = data?.clients ?? [];
  const products = data?.products ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<SaleItemForm[]>([{ productId: '', quantity: '' }]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  const clientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.fullName ?? clientId.slice(0, 8);

  const updateItem = (index: number, field: keyof SaleItemForm, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: '' }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const validItems = items
      .filter((item) => item.productId && item.quantity)
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      }));

    if (!clientId || validItems.length === 0) {
      setFormError('Selecciona un cliente y al menos un producto con cantidad');
      setSaving(false);
      return;
    }

    try {
      await api(`/sales`, {
        method: 'POST',
        body: JSON.stringify({ clientId, items: validItems }),
      });
      setCreateOpen(false);
      setClientId('');
      setItems([{ productId: '', quantity: '' }]);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo registrar la venta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas"
        description="Registra y consulta las ventas realizadas"
        actions={
          <Button
            onClick={() => {
              setClientId('');
              setItems([{ productId: '', quantity: '' }]);
              setFormError(null);
              setCreateOpen(true);
            }}
          >
            Nueva venta
          </Button>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}

      <Card>
        <DataTable<Sale>
          loading={loading}
          rows={sales}
          columns={[
            {
              header: 'ID',
              render: (sale) => <span className="font-mono text-xs text-gray-500">{sale.id.slice(0, 8)}</span>,
            },
            {
              header: 'Cliente',
              render: (sale) => <span className="text-gray-900">{clientName(sale.clientId)}</span>,
            },
            {
              header: 'Artículos',
              render: (sale) => (
                <span className="text-gray-500">{sale.items.length}</span>
              ),
            },
            {
              header: 'Total',
              render: (sale) => <span className="font-medium text-gray-900">{formatMoney(sale.total)}</span>,
            },
            {
              header: 'Estado',
              render: (sale) => (
                <Badge color={statusBadgeColor(sale.status)}>{statusLabels[sale.status]}</Badge>
              ),
            },
            {
              header: 'Fecha',
              render: (sale) => formatDateTime(sale.createdAt),
            },
            {
              header: 'Acciones',
              className: 'text-right',
              render: (sale) => (
                <Button size="sm" variant="ghost" onClick={() => setDetailSale(sale)}>
                  Ver detalle
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nueva venta"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert kind="error">{formError}</Alert>}

          <Select
            label="Cliente"
            name="clientId"
            placeholder="Selecciona un cliente"
            required
            options={clients.map((client) => ({
              value: client.id,
              label: `${client.fullName} (${client.documentNumber})`,
            }))}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />

          <div>
            <p className="mb-1 block text-sm font-medium text-gray-700">Productos</p>
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select
                      name={`product-${index}`}
                      placeholder="Selecciona un producto"
                      options={products.map((product) => ({
                        value: product.id,
                        label: `${product.name} — ${formatMoney(product.price)}`,
                      }))}
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      name={`qty-${index}`}
                      aria-label="Cantidad"
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => removeItem(index)}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" size="sm" variant="secondary" onClick={addItem}>
                Agregar producto
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              Registrar venta
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailSale !== null}
        onClose={() => setDetailSale(null)}
        title={`Detalle de venta ${detailSale?.id.slice(0, 8) ?? ''}`}
        size="lg"
      >
        {detailSale && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>
                Cliente: <strong>{clientName(detailSale.clientId)}</strong>
              </span>
              <Badge color={statusBadgeColor(detailSale.status)}>
                {statusLabels[detailSale.status]}
              </Badge>
              <span>{formatDateTime(detailSale.createdAt)}</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Producto</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Cantidad</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">P. unitario</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detailSale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-gray-900">{item.productName}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{formatMoney(item.unitPrice)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        {formatMoney(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <p className="text-base font-semibold text-gray-900">
                Total: {formatMoney(detailSale.total)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
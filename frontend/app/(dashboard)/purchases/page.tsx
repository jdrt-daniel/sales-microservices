'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/lib/use-async-data';
import type { Product, Purchase } from '@/lib/types';
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

interface PurchaseItemForm {
  productId: string;
  quantity: string;
  unitCost: string;
}

export default function PurchasesPage() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [purchasesData, productsData] = await Promise.all([
      api<Purchase[]>(`/purchases`),
      api<Product[]>(`/products`),
    ]);
    return { purchases: purchasesData, products: productsData };
  });
  const purchases = data?.purchases ?? [];
  const products = data?.products ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<PurchaseItemForm[]>([
    { productId: '', quantity: '', unitCost: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null);

  const updateItem = (index: number, field: keyof PurchaseItemForm, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: '', unitCost: '' }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const validItems = items
      .filter((item) => item.productId && item.quantity && item.unitCost)
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
      }));

    if (validItems.length === 0) {
      setFormError('Completa al menos un producto con cantidad y costo unitario');
      setSaving(false);
      return;
    }

    try {
      await api(`/purchases`, {
        method: 'POST',
        body: JSON.stringify({
          ...(supplierId ? { supplierId } : {}),
          items: validItems,
        }),
      });
      setCreateOpen(false);
      setSupplierId('');
      setItems([{ productId: '', quantity: '', unitCost: '' }]);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo registrar la compra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compras"
        description="Registra y consulta las compras a proveedores"
        actions={
          <Button
            onClick={() => {
              setSupplierId('');
              setItems([{ productId: '', quantity: '', unitCost: '' }]);
              setFormError(null);
              setCreateOpen(true);
            }}
          >
            Nueva compra
          </Button>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}

      <Card>
        <DataTable<Purchase>
          loading={loading}
          rows={purchases}
          columns={[
            {
              header: 'ID',
              render: (purchase) => (
                <span className="font-mono text-xs text-gray-500">{purchase.id.slice(0, 8)}</span>
              ),
            },
            {
              header: 'Proveedor',
              render: (purchase) => (
                <span className="text-gray-900">{purchase.supplierId ?? '—'}</span>
              ),
            },
            {
              header: 'Artículos',
              render: (purchase) => <span className="text-gray-500">{purchase.items.length}</span>,
            },
            {
              header: 'Total',
              render: (purchase) => (
                <span className="font-medium text-gray-900">{formatMoney(purchase.total)}</span>
              ),
            },
            {
              header: 'Estado',
              render: (purchase) => (
                <Badge color={statusBadgeColor(purchase.status)}>
                  {statusLabels[purchase.status]}
                </Badge>
              ),
            },
            {
              header: 'Fecha',
              render: (purchase) => formatDateTime(purchase.createdAt),
            },
            {
              header: 'Acciones',
              className: 'text-right',
              render: (purchase) => (
                <Button size="sm" variant="ghost" onClick={() => setDetailPurchase(purchase)}>
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
        title="Nueva compra"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert kind="error">{formError}</Alert>}

          <Input
            label="Proveedor (opcional)"
            name="supplierId"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            placeholder="Nombre o ID del proveedor"
          />

          <div>
            <p className="mb-1 block text-sm font-medium text-gray-700">Productos</p>
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              {items.map((item, index) => (
                <div key={index} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-40 flex-1">
                    <Select
                      name={`product-${index}`}
                      placeholder="Selecciona un producto"
                      options={products.map((product) => ({
                        value: product.id,
                        label: `${product.name} (${product.sku})`,
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
                  <div className="w-28">
                    <Input
                      name={`cost-${index}`}
                      aria-label="Costo unitario"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Costo"
                      value={item.unitCost}
                      onChange={(e) => updateItem(index, 'unitCost', e.target.value)}
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
              Registrar compra
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailPurchase !== null}
        onClose={() => setDetailPurchase(null)}
        title={`Detalle de compra ${detailPurchase?.id.slice(0, 8) ?? ''}`}
        size="lg"
      >
        {detailPurchase && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>
                Proveedor: <strong>{detailPurchase.supplierId ?? '—'}</strong>
              </span>
              <Badge color={statusBadgeColor(detailPurchase.status)}>
                {statusLabels[detailPurchase.status]}
              </Badge>
              <span>{formatDateTime(detailPurchase.createdAt)}</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Producto</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Cantidad</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Costo unitario</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detailPurchase.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-gray-900">{item.productName}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{formatMoney(item.unitCost)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        {formatMoney(item.unitCost * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <p className="text-base font-semibold text-gray-900">
                Total: {formatMoney(detailPurchase.total)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
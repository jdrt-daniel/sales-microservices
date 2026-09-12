'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/lib/use-async-data';
import type { Category, Product } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/format';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

interface ProductFormState {
  sku: string;
  name: string;
  price: string;
  stock: string;
  isActive: boolean;
  categoryId: string;
}

const emptyForm: ProductFormState = {
  sku: '',
  name: '',
  price: '',
  stock: '0',
  isActive: true,
  categoryId: '',
};

export default function ProductsPage() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [productsData, categoriesData] = await Promise.all([
      api<Product[]>(`/products`),
      api<Category[]>(`/categories`),
    ]);
    return { products: productsData, categories: categoriesData };
  });
  const products = data?.products ?? [];
  const categories = data?.categories ?? [];
  const [actionError, setActionError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [stockQty, setStockQty] = useState('');
  const [stockSaving, setStockSaving] = useState(false);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      sku: product.sku,
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      isActive: product.isActive,
      categoryId: product.category?.id ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        sku: form.sku,
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        isActive: form.isActive,
        categoryId: form.categoryId || undefined,
      };
      if (editingProduct) {
        await api(`/products/${editingProduct.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/products`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`¿Eliminar el producto ${product.name}?`)) return;
    try {
      await api(`/products/${product.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo eliminar el producto');
    }
  };

  const openStockModal = (product: Product) => {
    setStockTarget(product);
    setStockQty('');
    setStockModalOpen(true);
  };

  const handleStock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stockTarget) return;
    setStockSaving(true);
    setFormError(null);
    try {
      await api(`/products/${stockTarget.id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: Number(stockQty) }),
      });
      setStockModalOpen(false);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo ajustar el stock');
    } finally {
      setStockSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo, precios y stock"
        actions={<Button onClick={openCreate}>Nuevo producto</Button>}
      />

      {error && <Alert kind="error">{error}</Alert>}
      {actionError && <Alert kind="error">{actionError}</Alert>}

      <Card>
        <DataTable<Product>
          loading={loading}
          rows={products}
          columns={[
            {
              header: 'Producto',
              render: (product) => (
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                </div>
              ),
            },
            {
              header: 'Categoría',
              render: (product) => (
                <span className="text-gray-500">{product.category?.name ?? '—'}</span>
              ),
            },
            {
              header: 'Precio',
              render: (product) => (
                <span className="font-medium text-gray-900">{formatMoney(product.price)}</span>
              ),
            },
            {
              header: 'Stock',
              render: (product) => (
                <Badge color={product.stock > 0 ? 'green' : 'red'}>{product.stock}</Badge>
              ),
            },
            {
              header: 'Estado',
              render: (product) => (
                <Badge color={product.isActive ? 'green' : 'gray'}>
                  {product.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              ),
            },
            {
              header: 'Creado',
              render: (product) => formatDate(product.createdAt),
            },
            {
              header: 'Acciones',
              className: 'text-right',
              render: (product) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(product)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openStockModal(product)}>
                    Stock
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void handleDelete(product)}>
                    Eliminar
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Editar producto' : 'Nuevo producto'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert kind="error">{formError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="SKU"
              name="sku"
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
            <Input
              label="Nombre"
              name="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Precio"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              label="Stock inicial"
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <Select
            label="Categoría"
            name="categoryId"
            placeholder="Sin categoría"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          />
          {!editingProduct && (
            <p className="text-xs text-gray-500">
              El stock se gestiona desde la compra o el ajuste manual de stock.
            </p>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Producto activo
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingProduct ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={`Ajustar stock de ${stockTarget?.name ?? ''}`}
      >
        <form onSubmit={handleStock} className="space-y-4">
          {formError && <Alert kind="error">{formError}</Alert>}
          <p className="text-sm text-gray-500">
            Stock actual: <strong>{stockTarget?.stock}</strong>. Usa un valor positivo para
            aumentar o negativo para reducir.
          </p>
          <Input
            label="Cantidad"
            name="quantity"
            type="number"
            required
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value)}
            placeholder="Ej: 5 o -3"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setStockModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={stockSaving}>
              Ajustar stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
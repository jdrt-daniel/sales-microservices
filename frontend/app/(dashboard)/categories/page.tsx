'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/lib/use-async-data';
import type { Category } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

function flattenCategories(categories: Category[], depth = 0): Category[] {
  const result: Category[] = [];
  for (const category of categories) {
    result.push(category);
    if (category.children?.length) {
      result.push(...flattenCategories(category.children, depth + 1));
    }
  }
  return result;
}

export default function CategoriesPage() {
  const { data, loading, error, reload } = useAsyncData(async () =>
    api<Category[]>(`/categories`),
  );
  const categories = data ?? [];
  const [actionError, setActionError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingCategory(null);
    setName('');
    setParentId('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setParentId(category.parent?.id ?? '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name,
        ...(parentId ? { parentId } : {}),
      };
      if (editingCategory) {
        await api(`/categories/${editingCategory.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/categories`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`¿Eliminar la categoría ${category.name}?`)) return;
    try {
      await api(`/categories/${category.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo eliminar la categoría');
    }
  };

  const flattened = flattenCategories(categories);
  const parentOptions = flattened
    .filter((c) => c.id !== editingCategory?.id)
    .map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías"
        description="Gestiona la taxonomía de productos"
        actions={<Button onClick={openCreate}>Nueva categoría</Button>}
      />

      {error && <Alert kind="error">{error}</Alert>}
      {actionError && <Alert kind="error">{actionError}</Alert>}

      <Card>
        <DataTable<Category>
          loading={loading}
          rows={categories}
          columns={[
            {
              header: 'Nombre',
              render: (category) => <span className="font-medium text-gray-900">{category.name}</span>,
            },
            {
              header: 'Categoría padre',
              render: (category) =>
                category.parent ? (
                  <Badge color="gray">{category.parent.name}</Badge>
                ) : (
                  <span className="text-gray-400">—</span>
                ),
            },
            {
              header: 'Subcategorías',
              render: (category) => (
                <span className="text-gray-500">{category.children?.length ?? 0}</span>
              ),
            },
            {
              header: 'Creado',
              render: (category) => formatDate(category.createdAt),
            },
            {
              header: 'Acciones',
              className: 'text-right',
              render: (category) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(category)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void handleDelete(category)}>
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
        title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert kind="error">{formError}</Alert>}
          <Input
            label="Nombre"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            label="Categoría padre"
            name="parentId"
            placeholder="Sin categoría padre"
            options={parentOptions}
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingCategory ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/lib/use-async-data';
import type { Permission } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

export default function PermissionsPage() {
  const { data, loading, error, reload } = useAsyncData(async () =>
    api<Permission[]>(`/permissions`),
  );
  const permissions = data ?? [];
  const [actionError, setActionError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [resource, setResource] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await api(`/permissions`, {
        method: 'POST',
        body: JSON.stringify({ name, resource }),
      });
      setModalOpen(false);
      setName('');
      setResource('');
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo crear el permiso');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (permission: Permission) => {
    if (!window.confirm(`¿Eliminar el permiso ${permission.name}?`)) return;
    try {
      await api(`/permissions/${permission.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo eliminar el permiso');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permisos"
        description="Gestiona los permisos del sistema"
        actions={
          <Button
            onClick={() => {
              setName('');
              setResource('');
              setFormError(null);
              setModalOpen(true);
            }}
          >
            Nuevo permiso
          </Button>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}
      {actionError && <Alert kind="error">{actionError}</Alert>}

      <Card>
        <DataTable<Permission>
          loading={loading}
          rows={permissions}
          columns={[
            {
              header: 'Nombre',
              render: (permission) => <span className="font-medium text-gray-900">{permission.name}</span>,
            },
            {
              header: 'Recurso',
              render: (permission) => <Badge color="gray">{permission.resource}</Badge>,
            },
            {
              header: 'Acciones',
              className: 'text-right',
              render: (permission) => (
                <Button size="sm" variant="danger" onClick={() => void handleDelete(permission)}>
                  Eliminar
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo permiso"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert kind="error">{formError}</Alert>}
          <Input
            label="Nombre"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Crear usuario"
          />
          <Input
            label="Recurso"
            name="resource"
            required
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            placeholder="users:create"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              Crear permiso
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
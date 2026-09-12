'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/lib/use-async-data';
import type { Permission, Role } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

interface RoleFormState {
  name: string;
  description: string;
  permissionIds: string[];
}

const emptyForm: RoleFormState = {
  name: '',
  description: '',
  permissionIds: [],
};

export default function RolesPage() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [rolesData, permissionsData] = await Promise.all([
      api<Role[]>(`/roles`),
      api<Permission[]>(`/permissions`),
    ]);
    return { roles: rolesData, permissions: permissionsData };
  });
  const roles = data?.roles ?? [];
  const permissions = data?.permissions ?? [];
  const [actionError, setActionError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingRole(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description ?? '',
      permissionIds: role.permissions.map((p) => p.id),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingRole) {
        await api(`/roles/${editingRole.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.name,
            description: form.description || undefined,
            permissionIds: form.permissionIds,
          }),
        });
      } else {
        await api(`/roles`, {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            description: form.description || undefined,
            permissionIds: form.permissionIds,
          }),
        });
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el rol');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!window.confirm(`¿Eliminar el rol ${role.name}?`)) return;
    try {
      await api(`/roles/${role.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo eliminar el rol');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Gestiona los roles y sus permisos"
        actions={<Button onClick={openCreate}>Nuevo rol</Button>}
      />

      {error && <Alert kind="error">{error}</Alert>}
      {actionError && <Alert kind="error">{actionError}</Alert>}

      <Card>
        <DataTable<Role>
          loading={loading}
          rows={roles}
          columns={[
            {
              header: 'Nombre',
              render: (role) => <span className="font-medium text-gray-900">{role.name}</span>,
            },
            {
              header: 'Descripción',
              render: (role) => <span className="text-gray-500">{role.description ?? '—'}</span>,
            },
            {
              header: 'Permisos',
              render: (role) =>
                role.permissions.length === 0 ? (
                  <span className="text-gray-400">Sin permisos</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((permission) => (
                      <Badge key={permission.id} color="blue">
                        {permission.name}
                      </Badge>
                    ))}
                  </div>
                ),
            },
            {
              header: 'Acciones',
              className: 'text-right',
              render: (role) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(role)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void handleDelete(role)}>
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
        title={editingRole ? 'Editar rol' : 'Nuevo rol'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert kind="error">{formError}</Alert>}
          <Input
            label="Nombre"
            name="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            label="Descripción"
            name="description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div>
            <p className="mb-1 block text-sm font-medium text-gray-700">Permisos</p>
            <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-3">
              {permissions.length === 0 && (
                <p className="text-sm text-gray-400">No hay permisos disponibles</p>
              )}
              {permissions.map((permission) => (
                <label key={permission.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.permissionIds.includes(permission.id)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        permissionIds: e.target.checked
                          ? [...form.permissionIds, permission.id]
                          : form.permissionIds.filter((id) => id !== permission.id),
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{permission.name}</span>
                  <span className="text-xs text-gray-400">({permission.resource})</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingRole ? 'Guardar cambios' : 'Crear rol'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
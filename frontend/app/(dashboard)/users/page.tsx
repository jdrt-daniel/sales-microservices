'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/lib/use-async-data';
import type { Role, User } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

interface UserFormState {
  email: string;
  fullName: string;
  password: string;
  isActive: boolean;
  roleIds: string[];
}

const emptyForm: UserFormState = {
  email: '',
  fullName: '',
  password: '',
  isActive: true,
  roleIds: [],
};

function UserForm({
  initial,
  roles,
  onChange,
}: {
  initial: UserFormState;
  roles: Role[];
  onChange: (form: UserFormState) => void;
}) {
  return (
    <div className="space-y-4">
      <Input
        label="Nombre completo"
        name="fullName"
        required
        value={initial.fullName}
        onChange={(e) => onChange({ ...initial, fullName: e.target.value })}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        required
        value={initial.email}
        onChange={(e) => onChange({ ...initial, email: e.target.value })}
      />
      <Input
        label={initial.password === '' && initial.email !== '' ? 'Nueva contraseña' : 'Contraseña'}
        name="password"
        type="password"
        minLength={8}
        value={initial.password}
        onChange={(e) => onChange({ ...initial, password: e.target.value })}
        placeholder="Mínimo 8 caracteres"
      />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={initial.isActive}
          onChange={(e) => onChange({ ...initial, isActive: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        Usuario activo
      </label>
      <div>
        <p className="mb-1 block text-sm font-medium text-gray-700">Roles</p>
        <div className="space-y-1 rounded-lg border border-gray-200 p-3">
          {roles.length === 0 && (
            <p className="text-sm text-gray-400">No hay roles disponibles</p>
          )}
          {roles.map((role) => (
            <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={initial.roleIds.includes(role.id)}
                onChange={(e) =>
                  onChange({
                    ...initial,
                    roleIds: e.target.checked
                      ? [...initial.roleIds, role.id]
                      : initial.roleIds.filter((id) => id !== role.id),
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {role.name}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [usersData, rolesData] = await Promise.all([
      api<User[]>(`/users`),
      api<Role[]>(`/roles`),
    ]);
    return { users: usersData, roles: rolesData };
  });
  const users = data?.users ?? [];
  const roles = data?.roles ?? [];
  const [actionError, setActionError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      fullName: user.fullName,
      password: '',
      isActive: user.isActive,
      roleIds: user.roles.map((r) => r.id),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingUser) {
        await api(`/users/${editingUser.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            email: form.email,
            fullName: form.fullName,
            isActive: form.isActive,
            roleIds: form.roleIds,
            ...(form.password ? { password: form.password } : {}),
          }),
        });
      } else {
        await api(`/users`, {
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            fullName: form.fullName,
            password: form.password,
            isActive: form.isActive,
            roleIds: form.roleIds,
          }),
        });
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`¿Eliminar al usuario ${user.fullName}?`)) return;
    try {
      await api(`/users/${user.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario');
    }
  };

  const openPasswordModal = (user: User) => {
    setPasswordTarget(user);
    setNewPassword('');
    setPasswordModalOpen(true);
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordTarget) return;
    setPasswordSaving(true);
    setFormError(null);
    try {
      await api(`/users/${passwordTarget.id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ newPassword }),
      });
      setPasswordModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestiona los usuarios del sistema"
        actions={
          <Button onClick={openCreate}>Nuevo usuario</Button>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}
      {actionError && <Alert kind="error">{actionError}</Alert>}

      <Card>
        <DataTable<User>
          loading={loading}
          rows={users}
          columns={[
            {
              header: 'Nombre',
              render: (user) => (
                <div>
                  <p className="font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              ),
            },
            {
              header: 'Roles',
              render: (user) =>
                user.roles.length === 0 ? (
                  <span className="text-gray-400">Sin roles</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role.id} color="indigo">
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                ),
            },
            {
              header: 'Estado',
              render: (user) => (
                <Badge color={user.isActive ? 'green' : 'gray'}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              ),
            },
            {
              header: 'Creado',
              render: (user) => formatDateTime(user.createdAt),
            },
            {
              header: 'Acciones',
              className: 'text-right',
              render: (user) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(user)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openPasswordModal(user)}>
                    Contraseña
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void handleDelete(user)}>
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
        title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert kind="error">{formError}</Alert>}
          <UserForm initial={form} roles={roles} onChange={setForm} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingUser ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={`Cambiar contraseña de ${passwordTarget?.fullName ?? ''}`}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {formError && <Alert kind="error">{formError}</Alert>}
          <Input
            label="Nueva contraseña"
            name="newPassword"
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPasswordModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={passwordSaving}>
              Cambiar contraseña
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/lib/use-async-data';
import type { Client } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';

interface ClientFormState {
  documentNumber: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

const emptyForm: ClientFormState = {
  documentNumber: '',
  fullName: '',
  email: '',
  phone: '',
  address: '',
};

export default function ClientsPage() {
  const { data, loading, error, reload } = useAsyncData(async () =>
    api<Client[]>(`/clients`),
  );
  const clients = data ?? [];
  const [actionError, setActionError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      documentNumber: client.documentNumber,
      fullName: client.fullName,
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
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
        documentNumber: form.documentNumber,
        fullName: form.fullName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      };
      if (editingClient) {
        await api(`/clients/${editingClient.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/clients`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!window.confirm(`¿Eliminar al cliente ${client.fullName}?`)) return;
    try {
      await api(`/clients/${client.id}`, { method: 'DELETE' });
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo eliminar el cliente');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona la cartera de clientes"
        actions={<Button onClick={openCreate}>Nuevo cliente</Button>}
      />

      {error && <Alert kind="error">{error}</Alert>}
      {actionError && <Alert kind="error">{actionError}</Alert>}

      <Card>
        <DataTable<Client>
          loading={loading}
          rows={clients}
          columns={[
            {
              header: 'Cliente',
              render: (client) => (
                <div>
                  <p className="font-medium text-gray-900">{client.fullName}</p>
                  <p className="text-xs text-gray-500">DNI: {client.documentNumber}</p>
                </div>
              ),
            },
            {
              header: 'Contacto',
              render: (client) => (
                <div className="text-xs text-gray-500">
                  <p>{client.email ?? '—'}</p>
                  <p>{client.phone ?? '—'}</p>
                </div>
              ),
            },
            {
              header: 'Dirección',
              render: (client) => <span className="text-gray-500">{client.address ?? '—'}</span>,
            },
            {
              header: 'Creado',
              render: (client) => formatDate(client.createdAt),
            },
            {
              header: 'Acciones',
              className: 'text-right',
              render: (client) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(client)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void handleDelete(client)}>
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
        title={editingClient ? 'Editar cliente' : 'Nuevo cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert kind="error">{formError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Número de documento"
              name="documentNumber"
              required
              value={form.documentNumber}
              onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
            />
            <Input
              label="Nombre completo"
              name="fullName"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Teléfono"
              name="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Dirección"
              name="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingClient ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
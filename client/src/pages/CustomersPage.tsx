import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  Customer,
} from '../api/customers';
import { Modal } from '../components/Modal';
import { CustomerForm, CustomerFormValues } from '../components/CustomerForm';

export function CustomersPage() {
  const { data, isLoading, isError } = useCustomers();
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();
  const deleteMut = useDeleteCustomer();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const handleCreate = async (values: CustomerFormValues) => {
    await createMut.mutateAsync(values);
    setCreateOpen(false);
  };

  const handleUpdate = async (values: CustomerFormValues) => {
    if (!editing) return;
    await updateMut.mutateAsync({ id: editing.id, ...values });
    setEditing(null);
  };

  const handleDelete = (c: Customer) => {
    if (confirm(`Delete customer "${c.name}"? This also deletes their transactions.`)) {
      deleteMut.mutate(c.id);
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6 text-red-600">Failed to load customers.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Name</th>
              <th className="text-left p-3 text-sm font-semibold">Phone</th>
              <th className="text-left p-3 text-sm font-semibold">Created</th>
              <th className="text-right p-3 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data!.map((c) => (
              <tr key={c.id} className="border-t border-gray-200">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setEditing(c)}
                      title="Edit"
                      className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      title="Delete"
                      className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data!.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-500">No customers yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} title="Add Customer" onClose={() => setCreateOpen(false)}>
        <CustomerForm onSubmit={handleCreate} submitLabel="Create" />
      </Modal>

      <Modal open={!!editing} title="Edit Customer" onClose={() => setEditing(null)}>
        {editing && (
          <CustomerForm
            initialValues={{ name: editing.name, phone: editing.phone }}
            onSubmit={handleUpdate}
            submitLabel="Update"
          />
        )}
      </Modal>
    </div>
  );
}

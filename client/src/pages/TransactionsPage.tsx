import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  Transaction,
  TransactionType,
} from '../api/transactions';
import { useCustomers } from '../api/customers';
import { Modal } from '../components/Modal';
import { TransactionForm, TransactionFormValues } from '../components/TransactionForm';

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    customerId: searchParams.get('customerId') ?? undefined,
    type: (searchParams.get('type') as TransactionType | null) ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  };

  const { data, isLoading, isError } = useTransactions(filters);
  const { data: customers } = useCustomers();
  const createMut = useCreateTransaction();
  const updateMut = useUpdateTransaction();
  const deleteMut = useDeleteTransaction();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const handleCreate = async (values: TransactionFormValues) => {
    await createMut.mutateAsync(values);
    setCreateOpen(false);
  };

  const handleUpdate = async (values: TransactionFormValues) => {
    if (!editing) return;
    await updateMut.mutateAsync({ id: editing.id, ...values });
    setEditing(null);
  };

  const handleDelete = (t: Transaction) => {
    if (confirm(`Delete this ${t.type} transaction of ${t.amount}?`)) {
      deleteMut.mutate(t.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded shadow border border-gray-200 p-4 mb-4 grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
          <select
            value={filters.customerId ?? ''}
            onChange={(e) => updateFilter('customerId', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {customers?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            value={filters.type ?? ''}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All</option>
            <option value="DR">DR</option>
            <option value="CR">CR</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={filters.from ?? ''}
            onChange={(e) => updateFilter('from', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={filters.to ?? ''}
            onChange={(e) => updateFilter('to', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      {isLoading && <div className="p-4">Loading...</div>}
      {isError && <div className="p-4 text-red-600">Failed to load transactions.</div>}

      {data && (
        <div className="bg-white rounded shadow border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 text-sm font-semibold">Customer</th>
                <th className="text-left p-3 text-sm font-semibold">Type</th>
                <th className="text-right p-3 text-sm font-semibold">Amount</th>
                <th className="text-left p-3 text-sm font-semibold">Date</th>
                <th className="text-left p-3 text-sm font-semibold">Payment</th>
                <th className="text-left p-3 text-sm font-semibold">Device ID</th>
                <th className="text-left p-3 text-sm font-semibold">Vehicle ID</th>
                <th className="text-left p-3 text-sm font-semibold">Description</th>
                <th className="text-right p-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-t border-gray-200">
                  <td className="p-3">{t.customer.name}</td>
                  <td className="p-3">
                    {t.type === 'DR' ? (
                      <span title="Withdrawal (DR)" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        <ArrowUpRight size={12} strokeWidth={2.5} />
                        DR
                      </span>
                    ) : (
                      <span title="Credit (CR)" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <ArrowDownLeft size={12} strokeWidth={2.5} />
                        CR
                      </span>
                    )}
                  </td>
                  <td className={`p-3 text-right font-medium ${t.type === 'DR' ? 'text-red-600' : 'text-green-600'}`}>
                    {Number(t.amount).toFixed(2)}
                  </td>
                  <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="p-3">{t.paymentMode}</td>
                  <td className="p-3">{t.deviceId}</td>
                  <td className="p-3">{t.vehicleId}</td>
                  <td className="p-3">{t.description ?? ''}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(t)}
                        title="Edit"
                        className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        title="Delete"
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-3 text-center text-gray-500">No transactions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} title="Add Transaction" onClose={() => setCreateOpen(false)}>
        <TransactionForm onSubmit={handleCreate} submitLabel="Create" />
      </Modal>

      <Modal open={!!editing} title="Edit Transaction" onClose={() => setEditing(null)}>
        {editing && (
          <TransactionForm
            initialValues={{
              customerId: editing.customerId,
              type: editing.type,
              amount: Number(editing.amount),
              date: editing.date.slice(0, 10),
              description: editing.description ?? '',
              paymentMode: editing.paymentMode,
              deviceId: editing.deviceId,
              vehicleId: editing.vehicleId,
            }}
            onSubmit={handleUpdate}
            submitLabel="Update"
          />
        )}
      </Modal>
    </div>
  );
}

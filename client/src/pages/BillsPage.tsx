import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, Plus, Eye, Printer, Download } from 'lucide-react';
import { printBill, saveBill } from '../lib/billExport';
import { BillDocument } from '../components/BillDocument';
import {
  useBills,
  useCreateBill,
  useUpdateBill,
  useDeleteBill,
  useBillConfig,
  Bill,
} from '../api/bills';
import { useCustomers } from '../api/customers';
import { Modal } from '../components/Modal';
import { BillForm, BillFormValues } from '../components/BillForm';

function BillDetail({
  bill,
  gstPercent,
  onPrint,
  onSave,
}: {
  bill: Bill;
  gstPercent: number;
  onPrint: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex gap-2 justify-end print:hidden">
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
        >
          <Printer size={14} />
          Print
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Download size={14} />
          Save
        </button>
      </div>
      <BillDocument bill={bill} gstPercent={gstPercent} />
    </div>
  );
}

function handlePrintBill(bill: Bill, gstPercent: number) {
  printBill(bill, gstPercent);
}

function handleSaveBill(bill: Bill, gstPercent: number) {
  saveBill(bill, gstPercent);
}

export function BillsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = {
    customerId: searchParams.get('customerId') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  };

  const { data: config } = useBillConfig();
  const gstPercent = config?.gstPercent ?? 18;
  const { data, isLoading, isError } = useBills(filters);
  const { data: customers } = useCustomers();
  const createMut = useCreateBill();
  const updateMut = useUpdateBill();
  const deleteMut = useDeleteBill();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [viewing, setViewing] = useState<Bill | null>(null);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const handleCreate = async (values: BillFormValues) => {
    await createMut.mutateAsync(values);
    setCreateOpen(false);
  };

  const handleUpdate = async (values: BillFormValues) => {
    if (!editing) return;
    await updateMut.mutateAsync({ id: editing.id, ...values });
    setEditing(null);
  };

  const handleDelete = (bill: Bill) => {
    if (confirm(`Delete bill for ${bill.customer.name} (₹${Number(bill.totalAmount).toFixed(2)})?`)) {
      deleteMut.mutate(bill.id);
    }
  };

  const billToFormValues = (bill: Bill): Partial<BillFormValues> => ({
    customerId: bill.customerId,
    billDate: bill.billDate.slice(0, 10),
    deviceId: bill.deviceId,
    vehicleId: bill.vehicleId,
    notes: bill.notes ?? '',
    items: bill.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    })),
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Bills</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={16} />
          Create Bill
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        GST is fixed at {gstPercent}% on subtotal. Line amounts are calculated from quantity × rate per item.
        Default device/vehicle: PDD / HR73.
      </p>

      <div className="bg-white rounded shadow border border-gray-200 p-4 mb-4 grid grid-cols-3 gap-3">
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
      {isError && <div className="p-4 text-red-600">Failed to load bills.</div>}

      {data && (
        <div className="bg-white rounded shadow border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 text-sm font-semibold">Customer</th>
                <th className="text-left p-3 text-sm font-semibold">Date</th>
                <th className="text-left p-3 text-sm font-semibold">Device</th>
                <th className="text-left p-3 text-sm font-semibold">Vehicle</th>
                <th className="text-right p-3 text-sm font-semibold">Subtotal</th>
                <th className="text-right p-3 text-sm font-semibold">GST</th>
                <th className="text-right p-3 text-sm font-semibold">Total</th>
                <th className="text-center p-3 text-sm font-semibold">Bill</th>
                <th className="text-right p-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((bill) => (
                <tr key={bill.id} className="border-t border-gray-200">
                  <td className="p-3">{bill.customer.name}</td>
                  <td className="p-3">{new Date(bill.billDate).toLocaleDateString()}</td>
                  <td className="p-3">{bill.deviceId}</td>
                  <td className="p-3">{bill.vehicleId}</td>
                  <td className="p-3 text-right">₹{Number(bill.subtotal).toFixed(2)}</td>
                  <td className="p-3 text-right text-gray-600">₹{Number(bill.gstAmount).toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">₹{Number(bill.totalAmount).toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handlePrintBill(bill, gstPercent)}
                        title="Print bill"
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
                      >
                        <Printer size={14} />
                        Print
                      </button>
                      <button
                        onClick={() => handleSaveBill(bill, gstPercent)}
                        title="Save bill as file"
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-700 border border-blue-300 hover:bg-blue-50"
                      >
                        <Download size={14} />
                        Save
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setViewing(bill)}
                        title="View"
                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setEditing(bill)}
                        title="Edit"
                        className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(bill)}
                        title="Delete"
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-3 text-center text-gray-500">No bills yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} title="Create Bill" onClose={() => setCreateOpen(false)} wide>
        <BillForm onSubmit={handleCreate} submitLabel="Create Bill" />
      </Modal>

      <Modal open={!!editing} title="Edit Bill" onClose={() => setEditing(null)} wide>
        {editing && (
          <BillForm
            key={editing.id}
            initialValues={billToFormValues(editing)}
            onSubmit={handleUpdate}
            submitLabel="Update Bill"
          />
        )}
      </Modal>

      <Modal open={!!viewing} title="Bill Details" onClose={() => setViewing(null)} wide>
        {viewing && (
          <BillDetail
            bill={viewing}
            gstPercent={gstPercent}
            onPrint={() => handlePrintBill(viewing, gstPercent)}
            onSave={() => handleSaveBill(viewing, gstPercent)}
          />
        )}
      </Modal>
    </div>
  );
}

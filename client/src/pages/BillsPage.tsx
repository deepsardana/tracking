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
  BillCompany,
} from '../api/bills';
import { useCustomers } from '../api/customers';
import { Modal } from '../components/Modal';
import { BillForm, BillFormValues } from '../components/BillForm';

function BillDetail({
  bill,
  gstPercent,
  company,
  hsn,
  onPrint,
  onSave,
}: {
  bill: Bill;
  gstPercent: number;
  company?: BillCompany;
  hsn?: string;
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
      <BillDocument bill={bill} gstPercent={gstPercent} company={company} hsn={hsn} />
    </div>
  );
}

function handlePrintBill(bill: Bill, gstPercent: number, company?: BillCompany, hsn?: string) {
  printBill(bill, gstPercent, company, hsn);
}

function handleSaveBill(bill: Bill, gstPercent: number, company?: BillCompany, hsn?: string) {
  saveBill(bill, gstPercent, company, hsn);
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
    invoiceNo: bill.invoiceNo ?? bill.vehicleId,
    vehicleId: bill.vehicleId,
    vltdSerialNo: bill.vltdSerialNo ?? bill.deviceId,
    vltdImeiNo: bill.vltdImeiNo ?? '',
    inventoryDeviceId: bill.inventoryDeviceId ?? bill.inventoryDevice?.id ?? null,
    notes: bill.notes ?? '',
    items: bill.items.map((item) => ({
      description: item.description,
      hsn: item.hsn ?? config?.defaultHsn ?? '85269190',
      quantity: Number(item.quantity),
      per: item.per ?? 'PCS',
      unitPrice: Number(item.unitPrice),
      rateInclTax: Number(item.rateInclTax ?? item.unitPrice),
      discPercent: Number(item.discPercent ?? 0),
    })),
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Tax Invoices</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={16} />
          Create Bill
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Select a device from inventory or enter serial/IMEI manually. GST {gstPercent}% fixed. Print uses HK Trading bill header.
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
                <th className="text-left p-3 text-sm font-semibold">Invoice</th>
                <th className="text-left p-3 text-sm font-semibold">Date</th>
                <th className="text-left p-3 text-sm font-semibold">Serial / IMEI</th>
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
                  <td className="p-3 font-mono text-xs">{bill.invoiceNo ?? '—'}</td>
                  <td className="p-3">{new Date(bill.billDate).toLocaleDateString()}</td>
                  <td className="p-3 text-xs font-mono">
                    <div>{bill.vltdSerialNo ?? bill.deviceId}</div>
                    <div className="text-gray-500">{bill.vltdImeiNo ?? ''}</div>
                  </td>
                  <td className="p-3">{bill.vehicleId}</td>
                  <td className="p-3 text-right">₹{Number(bill.subtotal).toFixed(2)}</td>
                  <td className="p-3 text-right text-gray-600">₹{Number(bill.gstAmount).toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">₹{Number(bill.totalAmount).toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handlePrintBill(bill, gstPercent, config?.company, config?.defaultHsn)}
                        title="Print bill"
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
                      >
                        <Printer size={14} />
                        Print
                      </button>
                      <button
                        onClick={() => handleSaveBill(bill, gstPercent, config?.company, config?.defaultHsn)}
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
                  <td colSpan={10} className="p-3 text-center text-gray-500">No bills yet</td>
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
            company={config?.company}
            hsn={config?.defaultHsn}
            onPrint={() => handlePrintBill(viewing, gstPercent, config?.company, config?.defaultHsn)}
            onSave={() => handleSaveBill(viewing, gstPercent, config?.company, config?.defaultHsn)}
          />
        )}
      </Modal>
    </div>
  );
}
